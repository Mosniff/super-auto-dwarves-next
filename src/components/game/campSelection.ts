import { buyCharacter } from "@/lib/game/buyCharacter";
import { repositionCharacter } from "@/lib/game/repositionCharacter";
import { CAMP_ROSTER_SLOT_COUNT, type CampRoster } from "@/lib/game/campRoster";
import type { CampState } from "@/lib/game/campState";
import type { ShopListing } from "@/lib/game/shop";

// These are client-side hints derived from the same pure rules the server
// runs; the server re-validates every intent and its result is the only
// truth (CLAUDE.md -> "Security / anti-cheat model").

export type CampSelection =
  | { selectionKind: "none" }
  | { selectionKind: "shopListing"; shopListingId: string }
  | { selectionKind: "rosterSlot"; slotIndex: number };

export type CampClickTarget =
  | { targetKind: "shopListing"; shopListingId: string }
  | { targetKind: "rosterSlot"; slotIndex: number };

export type CampIntent =
  | { intentKind: "buy"; shopListingId: string; targetSlotIndex: number }
  | { intentKind: "reposition"; fromSlotIndex: number; toSlotIndex: number };

export interface CampClickResolution {
  nextCampSelection: CampSelection;
  campIntentToSubmit: CampIntent | null;
}

// Never actually used as an id — only buyCharacter's outcome is read, and
// nothing it returns here is kept or saved.
const SELECTION_PREVIEW_CHARACTER_ID = "selection-preview-character";

const allCampRosterSlotIndices = Array.from(
  { length: CAMP_ROSTER_SLOT_COUNT },
  (_, slotIndex) => slotIndex,
);

export function isBuyTargetSlot(
  campState: CampState,
  shopCatalogue: ShopListing[],
  shopListingId: string,
  slotIndex: number,
): boolean {
  return (
    buyCharacter(
      campState,
      shopCatalogue,
      shopListingId,
      slotIndex,
      SELECTION_PREVIEW_CHARACTER_ID,
    ).outcome === "accepted"
  );
}

export function isShopListingSelectable(
  campState: CampState,
  shopCatalogue: ShopListing[],
  shopListingId: string,
): boolean {
  return allCampRosterSlotIndices.some((slotIndex) =>
    isBuyTargetSlot(campState, shopCatalogue, shopListingId, slotIndex),
  );
}

export function isRepositionTargetSlot(
  campRoster: CampRoster,
  fromSlotIndex: number,
  toSlotIndex: number,
): boolean {
  return (
    repositionCharacter(campRoster, fromSlotIndex, toSlotIndex).outcome ===
    "accepted"
  );
}

export function isRosterSlotSelectable(
  campRoster: CampRoster,
  slotIndex: number,
): boolean {
  return allCampRosterSlotIndices.some(
    (otherSlotIndex) =>
      otherSlotIndex !== slotIndex &&
      isRepositionTargetSlot(campRoster, slotIndex, otherSlotIndex),
  );
}

const noSelection: CampSelection = { selectionKind: "none" };

// Nothing selected: a selectable listing or slot becomes selected;
// anything else changes nothing.
//
// A listing selected: clicking the same listing clears; a different
// selectable listing switches; a buy-target slot submits a buy and
// clears; any other roster slot click changes nothing (buying and
// repositioning are separate actions on separate kinds of selection, so an
// occupied, non-buyable slot is never itself picked up here).
//
// A roster slot selected: clicking the same slot clears; a
// reposition-target slot submits a reposition and clears; a selectable
// listing switches to it; any other roster slot click changes nothing.
export function resolveCampClick(
  campSelection: CampSelection,
  campClickTarget: CampClickTarget,
  campState: CampState,
  shopCatalogue: ShopListing[],
): CampClickResolution {
  const unchanged: CampClickResolution = {
    nextCampSelection: campSelection,
    campIntentToSubmit: null,
  };

  if (campSelection.selectionKind === "none") {
    if (campClickTarget.targetKind === "shopListing") {
      if (
        isShopListingSelectable(
          campState,
          shopCatalogue,
          campClickTarget.shopListingId,
        )
      ) {
        return {
          nextCampSelection: {
            selectionKind: "shopListing",
            shopListingId: campClickTarget.shopListingId,
          },
          campIntentToSubmit: null,
        };
      }
      return unchanged;
    }

    if (isRosterSlotSelectable(campState.campRoster, campClickTarget.slotIndex)) {
      return {
        nextCampSelection: {
          selectionKind: "rosterSlot",
          slotIndex: campClickTarget.slotIndex,
        },
        campIntentToSubmit: null,
      };
    }
    return unchanged;
  }

  if (campSelection.selectionKind === "shopListing") {
    if (campClickTarget.targetKind === "shopListing") {
      if (campClickTarget.shopListingId === campSelection.shopListingId) {
        return { nextCampSelection: noSelection, campIntentToSubmit: null };
      }
      if (
        isShopListingSelectable(
          campState,
          shopCatalogue,
          campClickTarget.shopListingId,
        )
      ) {
        return {
          nextCampSelection: {
            selectionKind: "shopListing",
            shopListingId: campClickTarget.shopListingId,
          },
          campIntentToSubmit: null,
        };
      }
      return unchanged;
    }

    if (
      isBuyTargetSlot(
        campState,
        shopCatalogue,
        campSelection.shopListingId,
        campClickTarget.slotIndex,
      )
    ) {
      return {
        nextCampSelection: noSelection,
        campIntentToSubmit: {
          intentKind: "buy",
          shopListingId: campSelection.shopListingId,
          targetSlotIndex: campClickTarget.slotIndex,
        },
      };
    }
    return unchanged;
  }

  // campSelection.selectionKind === "rosterSlot"
  if (campClickTarget.targetKind === "rosterSlot") {
    if (campClickTarget.slotIndex === campSelection.slotIndex) {
      return { nextCampSelection: noSelection, campIntentToSubmit: null };
    }
    if (
      isRepositionTargetSlot(
        campState.campRoster,
        campSelection.slotIndex,
        campClickTarget.slotIndex,
      )
    ) {
      return {
        nextCampSelection: noSelection,
        campIntentToSubmit: {
          intentKind: "reposition",
          fromSlotIndex: campSelection.slotIndex,
          toSlotIndex: campClickTarget.slotIndex,
        },
      };
    }
    return unchanged;
  }

  if (
    isShopListingSelectable(
      campState,
      shopCatalogue,
      campClickTarget.shopListingId,
    )
  ) {
    return {
      nextCampSelection: {
        selectionKind: "shopListing",
        shopListingId: campClickTarget.shopListingId,
      },
      campIntentToSubmit: null,
    };
  }
  return unchanged;
}
