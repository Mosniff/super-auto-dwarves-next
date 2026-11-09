import { isCampRosterSlotIndex } from "./campRoster";
import type { CampRoster } from "./campRoster";
import {
  CHARACTER_SHOP_SLOT_COUNT,
  type CharacterShopSlots,
} from "./characterShopSlots";
import type { CharacterTemplate } from "./characterTemplates";
import { spawnCharacterFromTemplate } from "./ownedCharacter";
import { SHOP_CHARACTER_PRICE } from "./shop";

// Temporary name: Phase 9 part 4c renames this to CampState, replacing the old one.
export interface ShopCampState {
  campRoster: CampRoster;
  gold: number;
  characterShopSlots: CharacterShopSlots;
}

export type BuyCharacterFromShopSlotRejectionReason =
  | "invalidRosterSlot"
  | "invalidShopSlot"
  | "shopSlotLocked"
  | "shopSlotSold"
  | "unknownCharacterTemplate"
  | "rosterSlotOccupied"
  | "notEnoughGold";

export type BuyCharacterFromShopSlotResult =
  | { outcome: "accepted"; nextShopCampState: ShopCampState }
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
  shopCampState: ShopCampState,
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

  const targetShopSlot = shopCampState.characterShopSlots[shopSlotIndex];

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
  if (shopCampState.campRoster[targetRosterSlotIndex] !== null) {
    return { outcome: "rejected", rejectionReason: "rosterSlotOccupied" };
  }

  if (shopCampState.gold < SHOP_CHARACTER_PRICE) {
    return { outcome: "rejected", rejectionReason: "notEnoughGold" };
  }

  const nextCampRoster = [...shopCampState.campRoster];
  nextCampRoster[targetRosterSlotIndex] = spawnCharacterFromTemplate(
    matchedCharacterTemplate,
    newCharacterId,
  );

  const nextCharacterShopSlots = [...shopCampState.characterShopSlots];
  nextCharacterShopSlots[shopSlotIndex] = { slotState: "sold" };

  return {
    outcome: "accepted",
    nextShopCampState: {
      campRoster: nextCampRoster,
      gold: shopCampState.gold - SHOP_CHARACTER_PRICE,
      characterShopSlots: nextCharacterShopSlots,
    },
  };
}
