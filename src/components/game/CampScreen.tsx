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
import { MoneyPile } from "@/components/game/MoneyPile";
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
import { canAffordShopCharacter } from "@/lib/game/shop";
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
    case "moneyPile":
      // The money pile is never a draggable source — only shop and roster
      // slot tiles are.
      throw new Error("The money pile cannot be a drag source.");
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

  // The roster dwarf in hand, if any: the money pile's sell button names it.
  const heldRosterCharacter =
    heldCampItem.selectionKind === "rosterSlot"
      ? playerCampRoster[heldCampItem.slotIndex]
      : null;

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
        // and the camp content can centre vertically. select-none so a
        // drag or a quick double click never selects text.
        className={`flex flex-1 flex-col select-none ${isSubmittingCampIntent ? "cursor-wait" : ""}`}
      >
        <GameScreenShell
          gamePhase="campPhase"
          playerBenchCharacters={playerCampRoster}
          showsPlayerCharacterProgression
          playerRosterLeadingControls={
            <MoneyPile
              gold={gold}
              isSellShown={heldRosterCharacter !== null}
              sellButtonLabel={
                heldRosterCharacter
                  ? t("moneyPileSellLabel", {
                      characterName: displayCharacterName(heldRosterCharacter),
                    })
                  : t("moneyPileSellPrompt")
              }
              presentation={campTargetPresentation({ targetKind: "moneyPile" })}
              isEnabled={isClickEnabled({ targetKind: "moneyPile" })}
              onClick={() => handleCampClick({ targetKind: "moneyPile" })}
            />
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
              isRosterSlotSelectable(playerCampRoster, slotIndex),
            slotPresentation: (slotIndex) =>
              campTargetPresentation({ targetKind: "rosterSlot", slotIndex }),
            slotExitKind: (slotIndex) =>
              rosterSlotExitKind(lastSubmittedCampIntent, revision, slotIndex),
            // Only a shop hold matches here: with a roster dwarf in hand, a
            // mergeable dwarf's merge zone draws its XP bar instead
            // (RosterSlotZones), and the card's own bar stays hidden.
            isSlotMatchingHeldItem: (slotIndex) =>
              isRosterSlotMatchingHeldItem(
                heldCampItem,
                slotIndex,
                campState,
                characterTemplates,
              ),
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
          {/* The shop as a market stall (Phase 16): a striped awning hangs
              under the SHOP banner over a dark wood backdrop, and the stall
              starts right under it rather than centring in the space
              (globals.css → "Phase 16 shop stall"). */}
          <div data-shop-awning aria-hidden="true" className="shrink-0" />
          <section
            data-shop-stall
            className="flex min-h-0 flex-1 flex-col items-center justify-start gap-4 p-(--camp-centre-padding) pt-(--shop-stall-top-padding)"
          >
            <ShopPanel
              characterShopSlots={characterShopSlots}
              characterTemplates={characterTemplates}
              isCharacterPriceAffordable={canAffordShopCharacter(gold)}
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
            <div data-drag-overlay-card className="h-full w-full">
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
