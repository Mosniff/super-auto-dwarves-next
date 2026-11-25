"use client";

import { useDroppable } from "@dnd-kit/react";
import { useTranslations } from "next-intl";
import { ArrowRightLeft, ChevronsUp } from "lucide-react";
import { ExperienceBarContents } from "./CharacterCard";
import type {
  CampClickTarget,
  RosterSlotZoneKind,
  RosterSlotZonesPresentation,
} from "./campSelection";

// Phase 16 split drop zones. While a roster dwarf is held, every other
// dwarf's card is covered by two half-card buttons — the top half swaps,
// the bottom half merges — each its own click and drop target, so click,
// keyboard and drag share one model (a drop is "click the target").
//
// The zones stay mounted on every occupied slot and are only hidden
// (invisible, aria-hidden, inert, droppables disabled) when nothing is
// held, the same pattern SellArea uses: a drop target that appears
// mid-drag is enabled, not mounted. The buttons fill their halves exactly,
// with no gap between them, so a pointer over the card is always over one
// zone; the visible boxes are inset inside them ([data-roster-slot-zone-box]).
// An ineligible merge zone stays a droppable (its drop does nothing), so a
// drop there can't fall through to dnd-kit's shape-intersection fallback
// and land on the swap zone instead.
//
// Every size, colour and glow is a globals.css variable ("Phase 16 split
// drop zones"); tests assert the data attributes, never classes.
//
// A mergeable dwarf's merge zone draws the XP bar itself, centred in its
// box (Phase 16 block 2b): the card's own bar lives inside the portrait,
// which clips it, so it can't be moved into the bottom half. The card's own
// bar stays hidden while its zones show. The zones overlay is a container
// as wide as the card, so the bar's cqw sizes match the card's.

type RosterSlotZoneButtonPresentation =
  | "eligible"
  | "ineligible"
  | "atMaxLevel"
  | "hidden";

interface RosterSlotZoneButtonProps {
  slotIndex: number;
  experience: number;
  zoneKind: RosterSlotZoneKind;
  presentation: RosterSlotZoneButtonPresentation;
  buttonLabel: string;
  isEnabled: boolean;
  onClick: () => void;
}

function RosterSlotZoneButton({
  slotIndex,
  experience,
  zoneKind,
  presentation,
  buttonLabel,
  isEnabled,
  onClick,
}: RosterSlotZoneButtonProps) {
  const t = useTranslations("common");
  const isShown = presentation !== "hidden";
  const campClickTarget: CampClickTarget = {
    targetKind: "rosterSlotZone",
    slotIndex,
    zoneKind,
  };

  const { ref: droppableRef, isDropTarget } = useDroppable({
    id: `roster-${zoneKind}-zone-${slotIndex}`,
    data: { campClickTarget },
    disabled: !isShown,
  });

  return (
    <button
      ref={droppableRef}
      type="button"
      aria-label={buttonLabel}
      disabled={!isEnabled}
      onClick={onClick}
      data-roster-slot-zone={zoneKind}
      data-roster-slot-zone-presentation={presentation}
      data-roster-slot-zone-drop-target={String(isShown && isDropTarget)}
      className="relative block min-h-0 w-full flex-1 focus-visible:outline-none"
    >
      {isShown && (
        <span
          data-roster-slot-zone-box
          aria-hidden="true"
          className="absolute inset-(--roster-slot-zone-inset) flex items-center justify-center rounded-(--roster-slot-zone-radius)"
        >
          {zoneKind === "swap" ? (
            <span
              data-camp-swap-marker
              className="pointer-events-none absolute top-(--card-badge-offset) left-(--card-badge-offset) z-10 flex size-(--card-badge-size) items-center justify-center rounded-full bg-sky-500 text-white shadow ring-2 ring-white"
            >
              <ArrowRightLeft className="size-(--card-badge-icon-size)" />
            </span>
          ) : (
            <span
              data-camp-merge-marker
              className="pointer-events-none absolute top-(--card-badge-offset) left-(--card-badge-offset) z-10 flex size-(--card-badge-size) items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-white"
            >
              <ChevronsUp className="size-(--card-badge-icon-size)" />
            </span>
          )}
          {zoneKind === "swap" && (
            <span data-roster-slot-zone-text>{t("swapPositionZoneText")}</span>
          )}
          {presentation === "atMaxLevel" && (
            <span data-roster-slot-zone-text>{t("experienceBarMax")}</span>
          )}
          {zoneKind === "merge" && presentation === "eligible" && (
            <span
              data-roster-slot-zone-experience
              className="flex w-full flex-col items-center gap-card-xp-text-gap px-card-hp-bar-inset"
            >
              <ExperienceBarContents experience={experience} />
            </span>
          )}
        </span>
      )}
    </button>
  );
}

interface RosterSlotZonesProps {
  slotIndex: number;
  // The zones' own dwarf's experience, for the merge zone's XP bar.
  experience: number;
  zonesPresentation: RosterSlotZonesPresentation;
  zoneButtonLabel: (zoneKind: RosterSlotZoneKind) => string;
  isZoneEnabled: (zoneKind: RosterSlotZoneKind) => boolean;
  onZoneClick: (zoneKind: RosterSlotZoneKind) => void;
}

export function RosterSlotZones({
  slotIndex,
  experience,
  zonesPresentation,
  zoneButtonLabel,
  isZoneEnabled,
  onZoneClick,
}: RosterSlotZonesProps) {
  const swapZonePresentation: RosterSlotZoneButtonPresentation =
    zonesPresentation.zonesShown
      ? zonesPresentation.swapZonePresentation
      : "hidden";
  const mergeZonePresentation: RosterSlotZoneButtonPresentation =
    zonesPresentation.zonesShown
      ? zonesPresentation.mergeZonePresentation
      : "hidden";

  return (
    <div
      data-roster-slot-zones
      aria-hidden={zonesPresentation.zonesShown ? undefined : true}
      inert={!zonesPresentation.zonesShown}
      className={`@container absolute inset-0 z-20 flex flex-col ${
        zonesPresentation.zonesShown ? "" : "invisible"
      }`}
    >
      <RosterSlotZoneButton
        slotIndex={slotIndex}
        experience={experience}
        zoneKind="swap"
        presentation={swapZonePresentation}
        buttonLabel={zoneButtonLabel("swap")}
        isEnabled={zonesPresentation.zonesShown && isZoneEnabled("swap")}
        onClick={() => onZoneClick("swap")}
      />
      <RosterSlotZoneButton
        slotIndex={slotIndex}
        experience={experience}
        zoneKind="merge"
        presentation={mergeZonePresentation}
        buttonLabel={zoneButtonLabel("merge")}
        isEnabled={zonesPresentation.zonesShown && isZoneEnabled("merge")}
        onClick={() => onZoneClick("merge")}
      />
    </div>
  );
}
