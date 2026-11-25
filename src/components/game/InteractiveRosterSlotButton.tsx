"use client";

import { useCallback } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/react";
import { ArrowRightLeft, ChevronsUp } from "lucide-react";
import type { Character } from "@/lib/game/character";
import type {
  CampClickTarget,
  CampTargetPresentation,
  RosterSlotZoneKind,
  RosterSlotZonesPresentation,
} from "./campSelection";
import type { RosterSlotExitKind } from "./rosterSlotAnimation";
import type { CampStartSlotBeat } from "./campStartSequence";
import { CharacterInfoControl } from "./CharacterInfoControl";
import { RosterSlot } from "./RosterSlot";
import { RosterSlotZones } from "./RosterSlotZones";

interface InteractiveRosterSlotButtonProps {
  slotIndex: number;
  character: Character | undefined;
  facing: "left" | "right";
  isNext: boolean;
  buttonLabel: string;
  isSelected: boolean;
  isEnabled: boolean;
  onClick: () => void;
  isDraggable: boolean;
  presentation: CampTargetPresentation;
  exitKind: RosterSlotExitKind;
  showsCharacterProgression?: boolean;
  isMatchingHeldItem: boolean;
  // Phase 12 start-of-camp sequence; display-only.
  campStartBeat?: CampStartSlotBeat;
  // Phase 16 split drop zones (RosterSlotZones' own comment).
  zonesPresentation: RosterSlotZonesPresentation;
  zoneButtonLabel: (zoneKind: RosterSlotZoneKind) => string;
  isZoneEnabled: (zoneKind: RosterSlotZoneKind) => boolean;
  onZoneClick: (zoneKind: RosterSlotZoneKind) => void;
}

// Visual classes come from the presentation state only (plus dimming the
// drag source), never from the native disabled attribute, isSelected or a
// standalone valid-drop-target flag — this keeps click-select and drag
// from ever presenting a tile differently.
function presentationClassName(
  presentation: CampTargetPresentation,
  isEnabled: boolean,
  isDropTarget: boolean,
): string {
  switch (presentation) {
    case "held":
      // Drawn by globals.css on [data-camp-target-presentation="held"] —
      // an animated gold ring, distinct from the grey keyboard-focus ring.
      return "";
    case "eligible":
      return isDropTarget
        ? "ring-4 ring-emerald-500"
        : "ring-2 ring-dashed ring-emerald-400";
    // Uses the eligible ring; the level-up marker is rendered separately
    // (see the merge marker below), so it isn't part of this className.
    case "mergeTarget":
      return isDropTarget
        ? "ring-4 ring-emerald-500"
        : "ring-2 ring-dashed ring-emerald-400";
    // Uses the eligible ring; the swap marker is rendered separately (see
    // the swap marker below), so it isn't part of this className.
    case "swapTarget":
      return isDropTarget
        ? "ring-4 ring-emerald-500"
        : "ring-2 ring-dashed ring-emerald-400";
    case "ineligible":
      return "opacity-50 cursor-not-allowed";
    case "neutral":
      return isEnabled ? "cursor-pointer" : "cursor-default";
  }
}

export function InteractiveRosterSlotButton({
  slotIndex,
  character,
  facing,
  isNext,
  buttonLabel,
  isSelected,
  isEnabled,
  onClick,
  isDraggable,
  presentation,
  exitKind,
  showsCharacterProgression = false,
  isMatchingHeldItem,
  campStartBeat,
  zonesPresentation,
  zoneButtonLabel,
  isZoneEnabled,
  onZoneClick,
}: InteractiveRosterSlotButtonProps) {
  // While this card shows its split zones (Phase 16), the zones replace
  // the whole-slot button: it is disabled, it is no drop target, and its
  // presentation ring and markers are not drawn (each zone draws its own).
  const zonesShown = zonesPresentation.zonesShown;
  const campClickTarget: CampClickTarget = {
    targetKind: "rosterSlot",
    slotIndex,
  };

  const { ref: draggableRef, isDragSource } = useDraggable({
    id: `roster-slot-${slotIndex}`,
    data: { campClickTarget, character },
    disabled: !isDraggable,
  });
  const { ref: droppableRef, isDropTarget } = useDroppable({
    id: `roster-drop-${slotIndex}`,
    data: { campClickTarget },
    disabled: zonesShown,
  });

  const combinedRef = useCallback(
    (element: Element | null) => {
      draggableRef(element);
      droppableRef(element);
    },
    [draggableRef, droppableRef],
  );

  const experienceBarRevealedAttributes = showsCharacterProgression
    ? {
        "data-experience-bar-revealed": String(
          isSelected || isMatchingHeldItem,
        ),
      }
    : {};

  return (
    // The host wrapper is a sibling-holder, not an interactive element: the
    // info control must never nest inside the slot button (invalid HTML),
    // so it's rendered here, beside it. globals.css reveals the control
    // inside a host carrying data-info-control-revealed="true", on hover,
    // or on keyboard focus within the host.
    <div
      data-info-control-host
      data-card-badge-basis="roster"
      data-info-control-revealed={String(isSelected)}
      data-roster-slot-zones-shown={String(zonesShown)}
      className="relative h-full w-full"
    >
      <button
        ref={combinedRef}
        type="button"
        aria-label={buttonLabel}
        aria-pressed={isSelected}
        disabled={!isEnabled || zonesShown}
        onClick={onClick}
        data-camp-target-presentation={presentation}
        // globals.css hides the card's XP bar inside any element carrying
        // this attribute, and reveals it on hover, keyboard focus, or
        // "true" (selected, or matching the held item). The card itself
        // stays unaware of these reveal rules.
        {...experienceBarRevealedAttributes}
        className={`relative block w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          zonesShown
            ? ""
            : presentationClassName(presentation, isEnabled, isDropTarget)
        } ${isDragSource ? "opacity-40" : ""}`}
      >
        <RosterSlot
          slotIndex={slotIndex}
          character={character}
          facing={facing}
          isNext={isNext}
          exitKind={exitKind}
          showsCharacterProgression={showsCharacterProgression}
          campStartBeat={campStartBeat}
        />
        {!zonesShown && presentation === "mergeTarget" && (
          // Top-left, so the top-right stays free for Phase 12's info
          // control. An icon, not "+1", because roster merges grant the
          // consumed dwarf's XP + 1. Rendered outside RosterSlot so the
          // recess's overflow-hidden doesn't clip it. z-10 lifts it only
          // above this slot's own card.
          <span
            data-camp-merge-marker
            aria-hidden="true"
            className="pointer-events-none absolute top-(--card-badge-offset) left-(--card-badge-offset) z-10 flex size-(--card-badge-size) items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-white"
          >
            <ChevronsUp aria-hidden="true" className="size-(--card-badge-icon-size)" />
          </span>
        )}
        {!zonesShown && presentation === "swapTarget" && (
          // Shares the merge marker's top-left spot — the two states never
          // coexist on the same tile — but a different colour (sky, not
          // emerald) so "swap" and "level up" read differently at a glance.
          // The human tunes both.
          <span
            data-camp-swap-marker
            aria-hidden="true"
            className="pointer-events-none absolute top-(--card-badge-offset) left-(--card-badge-offset) z-10 flex size-(--card-badge-size) items-center justify-center rounded-full bg-sky-500 text-white shadow ring-2 ring-white"
          >
            <ArrowRightLeft aria-hidden="true" className="size-(--card-badge-icon-size)" />
          </span>
        )}
      </button>
      {character && (
        <RosterSlotZones
          slotIndex={slotIndex}
          experience={character.experience}
          zonesPresentation={zonesPresentation}
          zoneButtonLabel={zoneButtonLabel}
          isZoneEnabled={isZoneEnabled}
          onZoneClick={onZoneClick}
        />
      )}
      {character && <CharacterInfoControl character={character} />}
    </div>
  );
}
