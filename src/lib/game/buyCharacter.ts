import { isCampRosterSlotIndex } from "./campRoster";
import type { CampState } from "./campState";
import { SHOP_CHARACTER_PRICE, type ShopListing } from "./shop";

export type BuyCharacterRejectionReason =
  | "invalidSlot"
  | "unknownListing"
  | "listingAlreadyPurchased"
  | "slotOccupied"
  | "notEnoughGold";

export type BuyCharacterResult =
  | { outcome: "accepted"; nextCampState: CampState }
  | { outcome: "rejected"; rejectionReason: BuyCharacterRejectionReason };

// Check order: invalidSlot (not an integer in 0..CAMP_ROSTER_SLOT_COUNT-1),
// then unknownListing, then listingAlreadyPurchased, then slotOccupied,
// then notEnoughGold.
export function buyCharacter(
  campState: CampState,
  shopCatalogue: ShopListing[],
  shopListingId: string,
  targetSlotIndex: number,
  newCharacterId: string,
): BuyCharacterResult {
  if (!isCampRosterSlotIndex(targetSlotIndex)) {
    return { outcome: "rejected", rejectionReason: "invalidSlot" };
  }

  const matchingListing = shopCatalogue.find(
    (shopListing) => shopListing.shopListingId === shopListingId,
  );

  if (matchingListing === undefined) {
    return { outcome: "rejected", rejectionReason: "unknownListing" };
  }

  if (campState.purchasedShopListingIds.includes(shopListingId)) {
    return { outcome: "rejected", rejectionReason: "listingAlreadyPurchased" };
  }

  if (campState.campRoster[targetSlotIndex] !== null) {
    return { outcome: "rejected", rejectionReason: "slotOccupied" };
  }

  if (campState.gold < SHOP_CHARACTER_PRICE) {
    return { outcome: "rejected", rejectionReason: "notEnoughGold" };
  }

  const newCampRoster = [...campState.campRoster];
  newCampRoster[targetSlotIndex] = {
    id: newCharacterId,
    ...matchingListing.characterTemplate,
  };

  return {
    outcome: "accepted",
    nextCampState: {
      campRoster: newCampRoster,
      gold: campState.gold - SHOP_CHARACTER_PRICE,
      purchasedShopListingIds: [
        ...campState.purchasedShopListingIds,
        shopListingId,
      ],
    },
  };
}
