import { isCampRosterSlotIndex } from "./campRoster";
import type { CampState } from "./campState";
import { CHARACTER_SHOP_SLOT_COUNT } from "./characterShopSlots";
import type { CharacterTemplate } from "./characterTemplates";
import { spawnCharacterFromTemplate } from "./ownedCharacter";
import { SHOP_CHARACTER_PRICE } from "./shop";

export type BuyCharacterFromShopSlotRejectionReason =
  | "invalidRosterSlot"
  | "invalidShopSlot"
  | "shopSlotLocked"
  | "shopSlotSold"
  | "unknownCharacterTemplate"
  | "rosterSlotOccupied"
  | "notEnoughGold";

export type BuyCharacterFromShopSlotResult =
  | { outcome: "accepted"; nextCampState: CampState }
  | {
      outcome: "rejected";
      rejectionReason: BuyCharacterFromShopSlotRejectionReason;
    };

// A valid character shop slot index: an integer from 0 to
// CHARACTER_SHOP_SLOT_COUNT - 1.
function isCharacterShopSlotIndex(candidateSlotIndex: number): boolean {
  return (
    Number.isInteger(candidateSlotIndex) &&
    candidateSlotIndex >= 0 &&
    candidateSlotIndex < CHARACTER_SHOP_SLOT_COUNT
  );
}

// Check order: invalidRosterSlot comes first to preserve the existing
// buyCharacter order, then the rest of the shop-level checks
// (invalidShopSlot, shopSlotLocked, shopSlotSold), then the
// character-specific checks (unknownCharacterTemplate,
// rosterSlotOccupied), then notEnoughGold last, so the most specific
// reason wins.
export function buyCharacterFromShopSlot(
  campState: CampState,
  characterTemplates: readonly CharacterTemplate[],
  shopSlotIndex: number,
  targetRosterSlotIndex: number,
  newCharacterId: string,
): BuyCharacterFromShopSlotResult {
  if (!isCampRosterSlotIndex(targetRosterSlotIndex)) {
    return { outcome: "rejected", rejectionReason: "invalidRosterSlot" };
  }

  if (!isCharacterShopSlotIndex(shopSlotIndex)) {
    return { outcome: "rejected", rejectionReason: "invalidShopSlot" };
  }

  const targetShopSlot = campState.characterShopSlots[shopSlotIndex];

  if (targetShopSlot.slotState === "locked") {
    return { outcome: "rejected", rejectionReason: "shopSlotLocked" };
  }

  if (targetShopSlot.slotState === "sold") {
    return { outcome: "rejected", rejectionReason: "shopSlotSold" };
  }

  // Shop-level checks end here. Character-specific checks begin below —
  // this is the seam a future equipment section's buy rule would share
  // the shop-level half with, while bringing its own checks here.

  const matchedCharacterTemplate = characterTemplates.find(
    (characterTemplate) =>
      characterTemplate.characterTemplateId ===
      targetShopSlot.characterTemplateId,
  );

  if (matchedCharacterTemplate === undefined) {
    return { outcome: "rejected", rejectionReason: "unknownCharacterTemplate" };
  }

  // Buying onto an occupied slot is a rejection until a "promotion" rule
  // is specified (CLAUDE.md -> "Camp: shop, roster and intents").
  if (campState.campRoster[targetRosterSlotIndex] !== null) {
    return { outcome: "rejected", rejectionReason: "rosterSlotOccupied" };
  }

  if (campState.gold < SHOP_CHARACTER_PRICE) {
    return { outcome: "rejected", rejectionReason: "notEnoughGold" };
  }

  const nextCampRoster = [...campState.campRoster];
  nextCampRoster[targetRosterSlotIndex] = spawnCharacterFromTemplate(
    matchedCharacterTemplate,
    newCharacterId,
  );

  const nextCharacterShopSlots = [...campState.characterShopSlots];
  nextCharacterShopSlots[shopSlotIndex] = { slotState: "sold" };

  return {
    outcome: "accepted",
    nextCampState: {
      campRoster: nextCampRoster,
      gold: campState.gold - SHOP_CHARACTER_PRICE,
      characterShopSlots: nextCharacterShopSlots,
    },
  };
}
