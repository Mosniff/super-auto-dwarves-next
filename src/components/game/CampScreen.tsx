"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { DragDropProvider, DragOverlay, PointerSensor } from "@dnd-kit/react";
import { Accessibility } from "@dnd-kit/dom";
import { GameScreenShell } from "@/components/game/GameScreenShell";
import { PendingSubmitButton } from "@/components/game/PendingSubmitButton";
import { ShopPanel } from "@/components/game/ShopPanel";
import { CharacterCard } from "@/components/game/CharacterCard";
import type { Character } from "@/lib/game/character";
import type { CampRoster } from "@/lib/game/campRoster";
import type { CampState } from "@/lib/game/campState";
import type { CharacterShopSlots } from "@/lib/game/characterShopSlots";
import type { CharacterTemplate } from "@/lib/game/characterTemplates";
import {
  isCampClickEffective,
  isCharacterShopSlotSelectable,
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
  advanceGameAction: (formData: FormData) => Promise<void>;
  buyCharacterAction: (formData: FormData) => Promise<void>;
  repositionCharacterAction: (formData: FormData) => Promise<void>;
}

function campSelectionFromClickTarget(
  campClickTarget: CampClickTarget,
): CampSelection {
  if (campClickTarget.targetKind === "characterShopSlot") {
    return {
      selectionKind: "characterShopSlot",
      shopSlotIndex: campClickTarget.shopSlotIndex,
    };
  }
  return { selectionKind: "rosterSlot", slotIndex: campClickTarget.slotIndex };
}

export function CampScreen({
  playerCampRoster,
  gold,
  characterShopSlots,
  characterTemplates,
  revision,
  advanceGameAction,
  buyCharacterAction,
  repositionCharacterAction,
}: CampScreenProps) {
  const t = useTranslations("common");

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

  const campState: CampState = {
    campRoster: playerCampRoster,
    gold,
    characterShopSlots,
  };

  function submitCampIntent(campIntent: CampIntent): void {
    const formData = new FormData();

    if (campIntent.intentKind === "buyCharacter") {
      formData.set("shopSlotIndex", String(campIntent.shopSlotIndex));
      formData.set(
        "targetRosterSlotIndex",
        String(campIntent.targetRosterSlotIndex),
      );
      formData.set("expectedRevision", String(revision));
      startCampIntentTransition(async () => {
        await buyCharacterAction(formData);
      });
    } else {
      formData.set("fromSlotIndex", String(campIntent.fromSlotIndex));
      formData.set("toSlotIndex", String(campIntent.toSlotIndex));
      formData.set("expectedRevision", String(revision));
      startCampIntentTransition(async () => {
        await repositionCharacterAction(formData);
      });
    }
  }

  function handleCampClick(campClickTarget: CampClickTarget): void {
    const resolution = resolveCampClick(
      campSelection,
      campClickTarget,
      campState,
      characterTemplates,
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
        className={isSubmittingCampIntent ? "cursor-wait" : ""}
      >
        <GameScreenShell
          gamePhase="campPhase"
          playerBenchCharacters={playerCampRoster}
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
                  })
                : t("rosterSlotEmptyLabel", { slotNumber: slotIndex + 1 });
            },
            isSlotDraggable: (slotIndex) =>
              !isSubmittingCampIntent &&
              isRosterSlotSelectable(playerCampRoster, slotIndex),
            slotPresentation: (slotIndex) =>
              campTargetPresentation({ targetKind: "rosterSlot", slotIndex }),
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
                isClickEnabled({ targetKind: "characterShopSlot", shopSlotIndex })
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
                handleCampClick({ targetKind: "characterShopSlot", shopSlotIndex })
              }
            />
            <form action={advanceGameAction}>
              <input
                type="hidden"
                name="expectedCurrentPhase"
                value="campPhase"
              />
              <PendingSubmitButton size="lg">
                {t("toBattle")}
              </PendingSubmitButton>
            </form>
          </section>
        </GameScreenShell>
      </div>
      <DragOverlay dropAnimation={null}>
        {(source) => {
          const character = source.data.character as Character | undefined;

          if (!character) {
            return null;
          }

          return (
            <div className="aspect-3/4 w-24">
              <CharacterCard character={character} />
            </div>
          );
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}
