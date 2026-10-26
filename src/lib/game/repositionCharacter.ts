import { isCampRosterSlotIndex, type CampRoster } from "./campRoster";

export type RepositionCharacterRejectionReason =
  | "invalidSlot"
  | "sameSlot"
  | "sourceSlotEmpty";

export type RepositionCharacterResult =
  | { outcome: "accepted"; nextCampRoster: CampRoster }
  | { outcome: "rejected"; rejectionReason: RepositionCharacterRejectionReason };

// Check order: invalidSlot (either index not an integer in range), then
// sameSlot, then sourceSlotEmpty. Moving to an empty slot moves the
// character; moving to an occupied slot swaps.
export function repositionCharacter(
  campRoster: CampRoster,
  fromSlotIndex: number,
  toSlotIndex: number,
): RepositionCharacterResult {
  if (
    !isCampRosterSlotIndex(fromSlotIndex) ||
    !isCampRosterSlotIndex(toSlotIndex)
  ) {
    return { outcome: "rejected", rejectionReason: "invalidSlot" };
  }

  if (fromSlotIndex === toSlotIndex) {
    return { outcome: "rejected", rejectionReason: "sameSlot" };
  }

  const movingCharacter = campRoster[fromSlotIndex];

  if (movingCharacter === null) {
    return { outcome: "rejected", rejectionReason: "sourceSlotEmpty" };
  }

  const nextCampRoster = [...campRoster];
  nextCampRoster[fromSlotIndex] = campRoster[toSlotIndex];
  nextCampRoster[toSlotIndex] = movingCharacter;

  return { outcome: "accepted", nextCampRoster };
}
