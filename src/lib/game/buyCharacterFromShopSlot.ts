import { isCampRosterSlotIndex } from "./campRoster";
import type { CampState } from "./campState";
import { CHARACTER_SHOP_SLOT_COUNT } from "./characterShopSlots";
import type { CharacterTemplate } from "./characterTemplates";
import { spawnCharacterFromTemplate } from "./spawnCharacterFromTemplate";
import { SHOP_CHARACTER_PRICE } from "./shop";
import {
  MAX_CHARACTER_LEVEL,
  levelFromExperience,
  mergeCharacterInto,
} from "./characterExperience";

export type BuyCharacterFromShopSlotRejectionReason =
  | "invalidRosterSlot"
  | "invalidShopSlot"
  | "shopSlotLocked"
  | "shopSlotSold"
  | "unknownCharacterTemplate"
  | "rosterSlotOccupied"
  | "rosterSlotAtMaxLevel"
  | "notEnoughGold";

export type BuyCharacterAcceptanceKind = "placed" | "merged";

export type BuyCharacterFromShopSlotResult =
  | {
      outcome: "accepted";
      acceptanceKind: BuyCharacterAcceptanceKind;
      nextCampState: CampState;
    }
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
// character-specific checks (unknownCharacterTemplate, rosterSlotOccupied
// for a non-matching occupant, rosterSlotAtMaxLevel for a matching
// level-5 occupant), then notEnoughGold last, so the most specific reason
// wins. rosterSlotAtMaxLevel is only ever returned for a matching
// occupant, so a preview can read "matching" from it without comparing
// templates on the client.
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

  const targetSlotOccupant = campState.campRoster[targetRosterSlotIndex];
  const isMatchingOccupant =
    targetSlotOccupant !== null &&
    targetSlotOccupant.characterTemplateId ===
      matchedCharacterTemplate.characterTemplateId;

  // A non-matching occupant is a rejection until a "promotion" rule is
  // specified (CLAUDE.md -> "Camp: shop, roster and intents"). A matching
  // occupant is a merge-buy target instead, subject to the max-level check
  // below.
  if (targetSlotOccupant !== null && !isMatchingOccupant) {
    return { outcome: "rejected", rejectionReason: "rosterSlotOccupied" };
  }

  if (
    isMatchingOccupant &&
    levelFromExperience(targetSlotOccupant.experience) === MAX_CHARACTER_LEVEL
  ) {
    return { outcome: "rejected", rejectionReason: "rosterSlotAtMaxLevel" };
  }

  if (campState.gold < SHOP_CHARACTER_PRICE) {
    return { outcome: "rejected", rejectionReason: "notEnoughGold" };
  }

  const hiredCharacter = spawnCharacterFromTemplate(
    matchedCharacterTemplate,
    newCharacterId,
  );

  const nextCampRoster = [...campState.campRoster];
  nextCampRoster[targetRosterSlotIndex] = isMatchingOccupant
    ? mergeCharacterInto(targetSlotOccupant, hiredCharacter)
    : hiredCharacter;

  const nextCharacterShopSlots = [...campState.characterShopSlots];
  nextCharacterShopSlots[shopSlotIndex] = { slotState: "sold" };

  return {
    outcome: "accepted",
    acceptanceKind: isMatchingOccupant ? "merged" : "placed",
    nextCampState: {
      campRoster: nextCampRoster,
      gold: campState.gold - SHOP_CHARACTER_PRICE,
      characterShopSlots: nextCharacterShopSlots,
    },
  };
}
