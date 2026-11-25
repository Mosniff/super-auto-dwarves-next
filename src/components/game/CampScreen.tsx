"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "motion/react";
import { DragDropProvider, DragOverlay, PointerSensor } from "@dnd-kit/react";
import { Accessibility } from "@dnd-kit/dom";
import { GameScreenShell } from "@/components/game/GameScreenShell";
import { useReportPhaseAdvanceAvailability } from "@/components/game/phaseAdvanceAvailability";
import { useArrivedFromPhase } from "@/components/game/phaseArrival";
import { useReportPendingHeaderGold } from "@/components/game/headerGoldDisplay";
import {
  CAMP_START_SEQUENCE_NOT_STARTED,
  campStartActivationsToPlay,
  campStartSequenceTimeline,
  campStartSlotBeat,
  advanceCampStartSequenceProgress,
  pendingCampStartGold,
} from "@/components/game/campStartSequence";
import { ShopPanel } from "@/components/game/ShopPanel";
import { CharacterCard } from "@/components/game/CharacterCard";
import { useCharacterDisplayName } from "@/components/game/characterDisplayName";
import { MergeSellToggle } from "@/components/game/MergeSellToggle";
import { MergeSellModeAnnouncer } from "@/components/game/MergeSellModeAnnouncer";
import { SellArea } from "@/components/game/SellArea";
import { useCampInteractionMode } from "@/components/game/useCampInteractionMode";
import {
  rosterSlotExitKind,
  type SubmittedCampIntent,
} from "@/components/game/rosterSlotAnimation";
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
  presentRosterSlotZones,
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
    case "rosterSlotZone":
      // A roster slot's zones are only ever drop and click targets (Phase
      // 16) — the dwarf is dragged by its whole-slot tile.
      throw new Error("A roster slot zone cannot be a drag source.");
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
  const displayCharacterName = useCharacterDisplayName();

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
  // Display-only, so the server never learns it: which intent was last
  // submitted, and at which revision, so a slot's departing card can tell
  // a merge-away or sell apart from a plain shuffle once the refreshed
  // props land (rosterSlotAnimation.ts's own comment).
  const [lastSubmittedCampIntent, setLastSubmittedCampIntent] =
    useState<SubmittedCampIntent | null>(null);

  // Decided once, on the camp's first render: arrivedFromPhase stays
  // "battlePhase" for the whole visit, so deciding on every render could
  // replay it.
  const arrivedFromPhase = useArrivedFromPhase();
  const prefersReducedMotion = useReducedMotion();
  const [campStartActivationsPlaying] = useState(() =>
    campStartActivationsToPlay(
      arrivedFromPhase,
      prefersReducedMotion === true,
      playerCampRoster,
    ),
  );
  const [campStartProgress, setCampStartProgress] = useState(
    CAMP_START_SEQUENCE_NOT_STARTED,
  );

  useEffect(() => {
    const timeoutIds = campStartSequenceTimeline(
      campStartActivationsPlaying.length,
    ).map((timelineEvent) =>
      window.setTimeout(() => {
        setCampStartProgress((progress) =>
          advanceCampStartSequenceProgress(progress, timelineEvent),
        );
      }, timelineEvent.atMs),
    );

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [campStartActivationsPlaying]);

  const isCampStartSequencePlaying =
    campStartActivationsPlaying.length > 0 && !campStartProgress.isFinished;
  const isCampInteractionLocked =
    isSubmittingCampIntent || isCampStartSequencePlaying;

  useReportPendingHeaderGold(
    pendingCampStartGold(
      campStartActivationsPlaying.map((activation) => activation.goldGained),
      campStartProgress.landedActivationCount,
    ),
  );

  useReportPhaseAdvanceAvailability("campPhase", !isCampInteractionLocked);

  // Radix's dismissable layer handles Escape first in the capture phase
  // and calls preventDefault(), so an Escape that closes a dialog never
  // also clears the selection.
  useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !event.defaultPrevented) {
        setCampSelection({ selectionKind: "none" });
      }
    }

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, []);

  const campState: CampState = {
    campRoster: playerCampRoster,
    gold,
    characterShopSlots,
  };

  // The item in hand: the drag source during a drag, otherwise the click
  // selection. Every tile's presentation is derived from this single value,
  // so click-select and drag always present identically.
  const heldCampItem = campDragSourceSelection ?? campSelection;

  // Client UI state only — the server never receives or learns it, only
  // the explicit intent (reposition vs. mergeCharacters) it caused the
  // player to submit. The interaction mode never affects a shop hold, so
  // this is told whenever one is held, purely so the toggle can tell the
  // truth about being inert (campInteractionMode.ts's own comment).
  const {
    campInteractionMode,
    isMergeSellToggleLatched,
    isMergeSellToggleDisabled,
    onMergeSellToggleClick,
  } = useCampInteractionMode(
    heldCampItem.selectionKind === "characterShopSlot",
  );

  function submitCampIntent(campIntent: CampIntent): void {
    setLastSubmittedCampIntent({ campIntent, submittedAtRevision: revision });

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
      !isCampInteractionLocked &&
      isCampClickEffective(
        campSelection,
        campClickTarget,
        campState,
        characterTemplates,
        campInteractionMode,
      )
    );
  }

  // Phase 16: each roster slot's split zones, relative to the item in hand
  // (the drag source during a drag, otherwise the click selection).
  function rosterSlotZonesPresentation(slotIndex: number) {
    return presentRosterSlotZones(
      heldCampItem,
      slotIndex,
      campState,
      characterTemplates,
    );
  }

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
        // globals.css hides every info control while a drag is in progress.
        data-camp-dragging={String(campDragSourceSelection !== null)}
        onClick={(event) => {
          // Clears the selection on a click inside the camp that isn't on
          // an interactive element. currentTarget.contains() excludes
          // clicks that bubbled through React from portalled content (the
          // info dialog).
          const clickedElement = event.target as Element;
          if (
            !event.currentTarget.contains(clickedElement) ||
            clickedElement.closest(
              "button, a, input, select, textarea, [role='button']",
            ) !== null
          ) {
            return;
          }
          setCampSelection({ selectionKind: "none" });
        }}
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
            <div className="flex w-full flex-1 flex-col gap-3 px-2">
              <MergeSellToggle
                isMergeOrSellModeActive={campInteractionMode === "mergeOrSell"}
                isLatched={isMergeSellToggleLatched}
                onClick={onMergeSellToggleClick}
                isDisabled={
                  isMergeSellToggleDisabled || isCampStartSequencePlaying
                }
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
                    characterName: displayCharacterName(character),
                    level: levelFromExperience(character.experience),
                  })
                : t("rosterSlotEmptyLabel", { slotNumber: slotIndex + 1 });
            },
            isSlotDraggable: (slotIndex) =>
              !isCampInteractionLocked &&
              isRosterSlotSelectable(
                playerCampRoster,
                slotIndex,
                campInteractionMode,
              ),
            slotPresentation: (slotIndex) =>
              campTargetPresentation({ targetKind: "rosterSlot", slotIndex }),
            slotExitKind: (slotIndex) =>
              rosterSlotExitKind(lastSubmittedCampIntent, revision, slotIndex),
            // While a card shows its split zones (Phase 16), its XP bar is
            // revealed exactly when its merge zone would merge.
            isSlotMatchingHeldItem: (slotIndex) => {
              const zonesPresentation = rosterSlotZonesPresentation(slotIndex);
              if (zonesPresentation.zonesShown) {
                return zonesPresentation.mergeZonePresentation === "eligible";
              }
              return isRosterSlotMatchingHeldItem(
                heldCampItem,
                slotIndex,
                campState,
                characterTemplates,
                campInteractionMode,
              );
            },
            slotCampStartBeat: (slotIndex) =>
              campStartSlotBeat(
                campStartActivationsPlaying,
                campStartProgress,
                slotIndex,
              ),
            slotZonesPresentation: rosterSlotZonesPresentation,
            slotZoneButtonLabel: (slotIndex, zoneKind) => {
              const character = playerCampRoster[slotIndex];
              const labelValues = {
                slotNumber: slotIndex + 1,
                characterName: character ? displayCharacterName(character) : "",
              };
              return zoneKind === "swap"
                ? t("rosterSlotSwapZoneLabel", labelValues)
                : t("rosterSlotMergeZoneLabel", labelValues);
            },
            isSlotZoneEnabled: (slotIndex, zoneKind) =>
              isClickEnabled({
                targetKind: "rosterSlotZone",
                slotIndex,
                zoneKind,
              }),
            onSlotZoneClick: (slotIndex, zoneKind) =>
              handleCampClick({
                targetKind: "rosterSlotZone",
                slotIndex,
                zoneKind,
              }),
          }}
        >
          <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-(--camp-centre-padding)">
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
                !isCampInteractionLocked &&
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
              {/* A dragged roster dwarf keeps its card as it is today
                  (showLevel). A dragged shop character shows the same
                  level pill and inline XP bar its shop tile shows, so the
                  preview matches the tile. */}
              <CharacterCard
                character={character}
                showLevel
                showInlineExperienceBar={
                  campClickTarget?.targetKind === "characterShopSlot"
                }
              />
            </div>
          );
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}
