"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { DragDropProvider, DragOverlay, PointerSensor } from "@dnd-kit/react";
import { Accessibility } from "@dnd-kit/dom";
import { GameScreenShell } from "@/components/game/GameScreenShell";
import { useReportPhaseAdvanceAvailability } from "@/components/game/phaseAdvanceAvailability";
import { ShopPanel } from "@/components/game/ShopPanel";
import { CharacterCard } from "@/components/game/CharacterCard";
import { MergeSellToggle } from "@/components/game/MergeSellToggle";
import { MergeSellModeAnnouncer } from "@/components/game/MergeSellModeAnnouncer";
import { SellArea } from "@/components/game/SellArea";
import { useCampInteractionMode } from "@/components/game/useCampInteractionMode";
import type { Character } from "@/lib/game/character";
import type { CampRoster } from "@/lib/game/campRoster";
import type { CampState } from "@/lib/game/campState";
import type { CharacterShopSlots } from "@/lib/game/characterShopSlots";
import type { CharacterTemplate } from "@/lib/game/characterTemplates";
import { levelFromExperience } from "@/lib/game/characterExperience";
import {
  isCampClickEffective,
  isCharacterShopSlotSelectable,
  isRosterSlotMatchingHeldItem,
  isRosterSlotSelectable,
  presentCampTarget,
  resolveCampClick,
  resolveCampDrop,
  type CampClickTarget,
  type CampIntent,
  type CampSelection,
  type CampTargetPresentation,
} from "@/components/game/campSelection";

interface CampScreenProps {
  playerCampRoster: CampRoster;
  gold: number;
  characterShopSlots: CharacterShopSlots;
  characterTemplates: readonly CharacterTemplate[];
  revision: number;
  buyCharacterAction: (formData: FormData) => Promise<void>;
  repositionCharacterAction: (formData: FormData) => Promise<void>;
  mergeCharacterAction: (formData: FormData) => Promise<void>;
  sellCharacterAction: (formData: FormData) => Promise<void>;
}

function campSelectionFromClickTarget(
  campClickTarget: CampClickTarget,
): CampSelection {
  switch (campClickTarget.targetKind) {
    case "characterShopSlot":
      return {
        selectionKind: "characterShopSlot",
        shopSlotIndex: campClickTarget.shopSlotIndex,
      };
    case "rosterSlot":
      return {
        selectionKind: "rosterSlot",
        slotIndex: campClickTarget.slotIndex,
      };
    case "sellArea":
      // The sell area is never a draggable source — only shop and roster
      // slot tiles are.
      throw new Error("The sell area cannot be a drag source.");
  }
}

export function CampScreen({
  playerCampRoster,
  gold,
  characterShopSlots,
  characterTemplates,
  revision,
  buyCharacterAction,
  repositionCharacterAction,
  mergeCharacterAction,
  sellCharacterAction,
}: CampScreenProps) {
  const t = useTranslations("common");

  // Client UI state only — the server never receives or learns it, only
  // the explicit intent (reposition vs. mergeCharacters) it caused the
  // player to submit.
  const {
    campInteractionMode,
    isMergeSellToggleLatched,
    onMergeSellToggleClick,
  } = useCampInteractionMode();

  // The selection, drag-source selection and pending-ness below are UI
  // state only, for click/drag feedback and disabling tiles mid-submit.
  // The server re-validates every intent; the page's reloaded props (from
  // the next load) are the truth.
  const [campSelection, setCampSelection] = useState<CampSelection>({
    selectionKind: "none",
  });
  const [campDragSourceSelection, setCampDragSourceSelection] =
    useState<CampSelection | null>(null);
  const [isSubmittingCampIntent, startCampIntentTransition] = useTransition();

  useReportPhaseAdvanceAvailability("campPhase", !isSubmittingCampIntent);

  const campState: CampState = {
    campRoster: playerCampRoster,
    gold,
    characterShopSlots,
  };

  function submitCampIntent(campIntent: CampIntent): void {
    const formData = new FormData();

    switch (campIntent.intentKind) {
      case "buyCharacter": {
        formData.set("shopSlotIndex", String(campIntent.shopSlotIndex));
        formData.set(
          "targetRosterSlotIndex",
          String(campIntent.targetRosterSlotIndex),
        );
        formData.set("expectedRevision", String(revision));
        startCampIntentTransition(async () => {
          await buyCharacterAction(formData);
        });
        return;
      }
      case "reposition": {
        formData.set("fromSlotIndex", String(campIntent.fromSlotIndex));
        formData.set("toSlotIndex", String(campIntent.toSlotIndex));
        formData.set("expectedRevision", String(revision));
        startCampIntentTransition(async () => {
          await repositionCharacterAction(formData);
        });
        return;
      }
      case "mergeCharacters": {
        formData.set("fromSlotIndex", String(campIntent.fromSlotIndex));
        formData.set("intoSlotIndex", String(campIntent.intoSlotIndex));
        formData.set("expectedRevision", String(revision));
        startCampIntentTransition(async () => {
          await mergeCharacterAction(formData);
        });
        return;
      }
      case "sellCharacter": {
        formData.set("slotIndex", String(campIntent.slotIndex));
        formData.set("expectedRevision", String(revision));
        startCampIntentTransition(async () => {
          await sellCharacterAction(formData);
        });
        return;
      }
    }
  }

  function handleCampClick(campClickTarget: CampClickTarget): void {
    const resolution = resolveCampClick(
      campSelection,
      campClickTarget,
      campState,
      characterTemplates,
      campInteractionMode,
    );

    setCampSelection(resolution.nextCampSelection);

    if (resolution.campIntentToSubmit !== null) {
      submitCampIntent(resolution.campIntentToSubmit);
    }
  }

  function isClickEnabled(campClickTarget: CampClickTarget): boolean {
    return (
      !isSubmittingCampIntent &&
      isCampClickEffective(
        campSelection,
        campClickTarget,
        campState,
        characterTemplates,
        campInteractionMode,
      )
    );
  }

  // The item in hand: the drag source during a drag, otherwise the click
  // selection. Every tile's presentation is derived from this single value,
  // so click-select and drag always present identically.
  const heldCampItem = campDragSourceSelection ?? campSelection;

  function campTargetPresentation(
    campClickTarget: CampClickTarget,
  ): CampTargetPresentation {
    return presentCampTarget(
      heldCampItem,
      campClickTarget,
      campState,
      characterTemplates,
      campInteractionMode,
    );
  }

  return (
    // dnd-kit's shipped files lack "use client", so DragDropProvider (and
    // the hooks it coordinates) must only be imported from client
    // components such as this one. The Accessibility plugin is removed
    // because it unconditionally overwrites our tiles' aria-pressed and
    // describes a keyboard drag that doesn't exist here — click-select,
    // not dnd-kit's own keyboard sensor, is the accessible path.
    <DragDropProvider
      sensors={[PointerSensor]}
      plugins={(defaultPlugins) =>
        defaultPlugins.filter(
          (defaultPlugin) => defaultPlugin !== Accessibility,
        )
      }
      onDragStart={(event) => {
        setCampSelection({ selectionKind: "none" });

        const dragSourceClickTarget = event.operation.source?.data
          .campClickTarget as CampClickTarget | undefined;

        if (dragSourceClickTarget) {
          setCampDragSourceSelection(
            campSelectionFromClickTarget(dragSourceClickTarget),
          );
        }
      }}
      onDragEnd={(event) => {
        setCampDragSourceSelection(null);

        if (event.canceled) {
          return;
        }

        const dropTargetClickTarget = event.operation.target?.data
          .campClickTarget as CampClickTarget | undefined;
        const dragSourceClickTarget = event.operation.source?.data
          .campClickTarget as CampClickTarget | undefined;

        if (!dropTargetClickTarget || !dragSourceClickTarget) {
          return;
        }

        const campIntent = resolveCampDrop(
          campSelectionFromClickTarget(dragSourceClickTarget),
          dropTargetClickTarget,
          campState,
          characterTemplates,
          campInteractionMode,
        );

        if (campIntent !== null) {
          submitCampIntent(campIntent);
        }
      }}
    >
      {/* This replaces the pending signal tiles used to get from disabled
          styling (now driven by presentation alone). Tiles are
          deliberately not dimmed, to avoid flicker on fast responses. */}
      <div
        aria-busy={isSubmittingCampIntent}
        // Must stay a flex column so the shell below can fill the height
        // and the camp content can centre vertically. select-none because
        // Shift-click (holding Shift to enter merge/sell mode, then
        // clicking a tile) would otherwise extend a text selection.
        className={`flex flex-1 flex-col select-none ${isSubmittingCampIntent ? "cursor-wait" : ""}`}
      >
        <GameScreenShell
          gamePhase="campPhase"
          playerBenchCharacters={playerCampRoster}
          showsPlayerCharacterProgression
          playerRosterTrailingControls={
            <div className="flex w-full flex-1 flex-col gap-3 px-6">
              <MergeSellToggle
                isMergeOrSellModeActive={campInteractionMode === "mergeOrSell"}
                isLatched={isMergeSellToggleLatched}
                onClick={onMergeSellToggleClick}
              />
              <SellArea
                isShown={
                  campInteractionMode === "mergeOrSell" &&
                  heldCampItem.selectionKind === "rosterSlot"
                }
                presentation={campTargetPresentation({
                  targetKind: "sellArea",
                })}
                isEnabled={isClickEnabled({ targetKind: "sellArea" })}
                onClick={() => handleCampClick({ targetKind: "sellArea" })}
              />
              <MergeSellModeAnnouncer
                campInteractionMode={campInteractionMode}
              />
            </div>
          }
          playerSlotInteraction={{
            selectedSlotIndex:
              campSelection.selectionKind === "rosterSlot"
                ? campSelection.slotIndex
                : null,
            isSlotEnabled: (slotIndex) =>
              isClickEnabled({ targetKind: "rosterSlot", slotIndex }),
            onSlotClick: (slotIndex) =>
              handleCampClick({ targetKind: "rosterSlot", slotIndex }),
            slotButtonLabel: (slotIndex) => {
              const character = playerCampRoster[slotIndex];
              return character
                ? t("rosterSlotOccupiedLabel", {
                    slotNumber: slotIndex + 1,
                    characterName: character.name,
                    level: levelFromExperience(character.experience),
                  })
                : t("rosterSlotEmptyLabel", { slotNumber: slotIndex + 1 });
            },
            isSlotDraggable: (slotIndex) =>
              !isSubmittingCampIntent &&
              isRosterSlotSelectable(
                playerCampRoster,
                slotIndex,
                campInteractionMode,
              ),
            slotPresentation: (slotIndex) =>
              campTargetPresentation({ targetKind: "rosterSlot", slotIndex }),
            isSlotMatchingHeldItem: (slotIndex) =>
              isRosterSlotMatchingHeldItem(
                heldCampItem,
                slotIndex,
                campState,
                characterTemplates,
                campInteractionMode,
              ),
          }}
        >
          <section className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <ShopPanel
              characterShopSlots={characterShopSlots}
              characterTemplates={characterTemplates}
              selectedShopSlotIndex={
                campSelection.selectionKind === "characterShopSlot"
                  ? campSelection.shopSlotIndex
                  : null
              }
              isShopSlotEnabled={(shopSlotIndex) =>
                isClickEnabled({
                  targetKind: "characterShopSlot",
                  shopSlotIndex,
                })
              }
              isShopSlotDraggable={(shopSlotIndex) =>
                !isSubmittingCampIntent &&
                isCharacterShopSlotSelectable(
                  campState,
                  characterTemplates,
                  shopSlotIndex,
                )
              }
              shopSlotPresentation={(shopSlotIndex) =>
                campTargetPresentation({
                  targetKind: "characterShopSlot",
                  shopSlotIndex,
                })
              }
              onShopSlotClick={(shopSlotIndex) =>
                handleCampClick({
                  targetKind: "characterShopSlot",
                  shopSlotIndex,
                })
              }
            />
          </section>
        </GameScreenShell>
      </div>
      <DragOverlay dropAnimation={null}>
        {(source) => {
          const character = source.data.character as Character | undefined;

          if (!character) {
            return null;
          }

          const campClickTarget = source.data.campClickTarget as
            | CampClickTarget
            | undefined;

          return (
            <div className="aspect-3/4 w-(--shop-tile-width)">
              {/* A dragged roster dwarf keeps its level pill; a dragged
                  shop character (always level 1) doesn't show one. */}
              <CharacterCard
                character={character}
                showLevel={campClickTarget?.targetKind === "rosterSlot"}
              />
            </div>
          );
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}
