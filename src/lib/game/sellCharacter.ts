import { isCampRosterSlotIndex, type CampRoster } from "./campRoster";
import type { CampState } from "./campState";
import { CHARACTER_SELL_PRICE } from "./shop";

export type SellCharacterRejectionReason = "invalidSlot" | "slotEmpty";

export type SellCharacterResult =
  | { outcome: "accepted"; nextCampState: CampState }
  | { outcome: "rejected"; rejectionReason: SellCharacterRejectionReason };

// Exported so previews (campSelection's isSellableRosterSlot) ask this rule
// whether a slot is sellable, rather than assuming "occupied means
// sellable".
export function sellCharacterRejectionReason(
  campRoster: CampRoster,
  slotIndex: number,
): SellCharacterRejectionReason | null {
  if (!isCampRosterSlotIndex(slotIndex)) {
    return "invalidSlot";
  }

  if (campRoster[slotIndex] === null) {
    return "slotEmpty";
  }

  return null;
}

// Rulings (human, Phase 11): a flat sell price via CHARACTER_SELL_PRICE
// (future effects will change it); selling the last dwarf is allowed; no
// confirmation.
export function sellCharacter(
  campState: CampState,
  slotIndex: number,
): SellCharacterResult {
  const rejectionReason = sellCharacterRejectionReason(
    campState.campRoster,
    slotIndex,
  );

  if (rejectionReason !== null) {
    return { outcome: "rejected", rejectionReason };
  }

  const nextCampRoster = [...campState.campRoster];
  nextCampRoster[slotIndex] = null;

  return {
    outcome: "accepted",
    nextCampState: {
      ...campState,
      campRoster: nextCampRoster,
      gold: campState.gold + CHARACTER_SELL_PRICE,
    },
  };
}
