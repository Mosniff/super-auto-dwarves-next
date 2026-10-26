import type { Character, Roster } from "@/lib/battle/types";

export const CAMP_ROSTER_SLOT_COUNT = 7;

// Always exactly CAMP_ROSTER_SLOT_COUNT slots, index 0 is the front, gaps
// (null) allowed anywhere; length is enforced where persisted data is
// parsed, not here.
export type CampRosterSlot = Character | null;
export type CampRoster = CampRosterSlot[];

export function createEmptyCampRoster(): CampRoster {
  return Array.from({ length: CAMP_ROSTER_SLOT_COUNT }, () => null);
}

// A valid camp roster slot index: an integer from 0 to
// CAMP_ROSTER_SLOT_COUNT - 1.
export function isCampRosterSlotIndex(candidateSlotIndex: number): boolean {
  return (
    Number.isInteger(candidateSlotIndex) &&
    candidateSlotIndex >= 0 &&
    candidateSlotIndex < CAMP_ROSTER_SLOT_COUNT
  );
}

// The conversion seam between the camp roster and the battle Roster
// (CLAUDE.md -> "Persistence & save model", camp-roster gaps seam); it
// preserves relative order, front first; downedCharacters is always empty
// because nothing is downed outside battle.
export function squeezeCampRoster(campRoster: CampRoster): Roster {
  const activeCharacters = campRoster.filter(
    (campRosterSlot): campRosterSlot is Character => campRosterSlot !== null,
  );

  return { activeCharacters, downedCharacters: [] };
}
