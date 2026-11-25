import {
  buyCharacterFromShopSlot,
  type BuyCharacterFromShopSlotResult,
} from "@/lib/game/buyCharacterFromShopSlot";
import { repositionCharacter } from "@/lib/game/repositionCharacter";
import { mergeRosterCharacters } from "@/lib/game/mergeRosterCharacters";
import { sellCharacterRejectionReason } from "@/lib/game/sellCharacter";
import { CAMP_ROSTER_SLOT_COUNT, type CampRoster } from "@/lib/game/campRoster";
import type { CampState } from "@/lib/game/campState";
import type { CharacterTemplate } from "@/lib/game/characterTemplates";

// These are client-side hints derived from the same pure rules the server
// runs; the server re-validates every intent and its result is the only
// truth (CLAUDE.md -> "Security / anti-cheat model").

export type CampSelection =
  | { selectionKind: "none" }
  | { selectionKind: "characterShopSlot"; shopSlotIndex: number }
  | { selectionKind: "rosterSlot"; slotIndex: number };

// Phase 16: while a roster dwarf is held, every other dwarf shows two
// zones — the top half swaps, the bottom half merges — each its own click
// and drop target, so swapping and merging need no mode (Phase 11's
// merge/sell mode was removed in Phase 16). Selling is a drop on the money
// pile.
export type RosterSlotZoneKind = "swap" | "merge";

export type CampClickTarget =
  | { targetKind: "characterShopSlot"; shopSlotIndex: number }
  | { targetKind: "rosterSlot"; slotIndex: number }
  | {
      targetKind: "rosterSlotZone";
      slotIndex: number;
      zoneKind: RosterSlotZoneKind;
    }
  | { targetKind: "moneyPile" };

export type CampIntent =
  | {
      intentKind: "buyCharacter";
      shopSlotIndex: number;
      targetRosterSlotIndex: number;
    }
  | { intentKind: "reposition"; fromSlotIndex: number; toSlotIndex: number }
  | {
      intentKind: "mergeCharacters";
      fromSlotIndex: number;
      intoSlotIndex: number;
    }
  | { intentKind: "sellCharacter"; slotIndex: number };

export interface CampClickResolution {
  nextCampSelection: CampSelection;
  campIntentToSubmit: CampIntent | null;
}

// Never actually used as an id — only previewBuyCharacterFromShopSlot's
// result's outcome, acceptance kind and rejection reason are read, and
// nothing it returns here is kept or saved.
const SELECTION_PREVIEW_CHARACTER_ID = "selection-preview-character";

const allCampRosterSlotIndices = Array.from(
  { length: CAMP_ROSTER_SLOT_COUNT },
  (_, slotIndex) => slotIndex,
);

function previewBuyCharacterFromShopSlot(
  campState: CampState,
  characterTemplates: readonly CharacterTemplate[],
  shopSlotIndex: number,
  rosterSlotIndex: number,
): BuyCharacterFromShopSlotResult {
  return buyCharacterFromShopSlot(
    campState,
    characterTemplates,
    shopSlotIndex,
    rosterSlotIndex,
    SELECTION_PREVIEW_CHARACTER_ID,
  );
}

export function isBuyTargetSlot(
  campState: CampState,
  characterTemplates: readonly CharacterTemplate[],
  shopSlotIndex: number,
  rosterSlotIndex: number,
): boolean {
  return (
    previewBuyCharacterFromShopSlot(
      campState,
      characterTemplates,
      shopSlotIndex,
      rosterSlotIndex,
    ).outcome === "accepted"
  );
}

export function isCharacterShopSlotSelectable(
  campState: CampState,
  characterTemplates: readonly CharacterTemplate[],
  shopSlotIndex: number,
): boolean {
  return allCampRosterSlotIndices.some((rosterSlotIndex) =>
    isBuyTargetSlot(
      campState,
      characterTemplates,
      shopSlotIndex,
      rosterSlotIndex,
    ),
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

export function isMergeTargetSlot(
  campRoster: CampRoster,
  fromSlotIndex: number,
  intoSlotIndex: number,
): boolean {
  return (
    mergeRosterCharacters(campRoster, fromSlotIndex, intoSlotIndex)
      .outcome === "accepted"
  );
}

// Asks sellCharacter's own rule, never assuming "occupied means sellable".
export function isSellableRosterSlot(
  campRoster: CampRoster,
  slotIndex: number,
): boolean {
  return sellCharacterRejectionReason(campRoster, slotIndex) === null;
}

// A slot is selectable when its dwarf can be sold (the money pile), or
// when some other slot is a reposition target for it. Merge targets need
// no check of their own: a dwarf that can merge can also be sold.
export function isRosterSlotSelectable(
  campRoster: CampRoster,
  slotIndex: number,
): boolean {
  if (isSellableRosterSlot(campRoster, slotIndex)) {
    return true;
  }

  return allCampRosterSlotIndices.some(
    (otherSlotIndex) =>
      otherSlotIndex !== slotIndex &&
      isRepositionTargetSlot(campRoster, slotIndex, otherSlotIndex),
  );
}

const noSelection: CampSelection = { selectionKind: "none" };

// Phase 16. A zone only acts for a held roster dwarf: the swap zone submits
// whatever reposition the rule accepts (onto a dwarf, a swap), the merge
// zone whatever merge the rule accepts; anything else changes nothing.
// Shop holds keep the whole-card target (a merge-buy is a click on the
// rosterSlot target), so zones do nothing for them.
function resolveRosterSlotZoneClick(
  campSelection: CampSelection,
  rosterSlotZoneTarget: Extract<
    CampClickTarget,
    { targetKind: "rosterSlotZone" }
  >,
  campRoster: CampRoster,
): CampClickResolution {
  const unchanged: CampClickResolution = {
    nextCampSelection: campSelection,
    campIntentToSubmit: null,
  };

  if (campSelection.selectionKind !== "rosterSlot") {
    return unchanged;
  }

  if (rosterSlotZoneTarget.zoneKind === "swap") {
    if (
      isRepositionTargetSlot(
        campRoster,
        campSelection.slotIndex,
        rosterSlotZoneTarget.slotIndex,
      )
    ) {
      return {
        nextCampSelection: noSelection,
        campIntentToSubmit: {
          intentKind: "reposition",
          fromSlotIndex: campSelection.slotIndex,
          toSlotIndex: rosterSlotZoneTarget.slotIndex,
        },
      };
    }
    return unchanged;
  }

  // rosterSlotZoneTarget.zoneKind === "merge"
  if (
    isMergeTargetSlot(
      campRoster,
      campSelection.slotIndex,
      rosterSlotZoneTarget.slotIndex,
    )
  ) {
    return {
      nextCampSelection: noSelection,
      campIntentToSubmit: {
        intentKind: "mergeCharacters",
        fromSlotIndex: campSelection.slotIndex,
        intoSlotIndex: rosterSlotZoneTarget.slotIndex,
      },
    };
  }
  return unchanged;
}

// Nothing selected: a selectable character shop slot or roster slot becomes
// selected; the money pile does nothing (there's nothing held to sell);
// anything else changes nothing.
//
// A character shop slot selected: clicking the same slot clears; a
// different selectable shop slot switches; a buy-target roster slot
// submits a buy and clears; any other roster slot click changes nothing
// (buying and repositioning are separate actions on separate kinds of
// selection, so an occupied, non-buyable slot is never itself picked up
// here — this asymmetry is what lets the merge-buy rule turn a click on a
// matching dwarf into a buy with no change here). The money pile does
// nothing (a shop character can't be sold).
//
// A roster slot selected: clicking the same slot clears; an empty slot
// that's a reposition target submits a reposition (a move) and clears; the
// money pile submits a sellCharacter intent and clears when the held slot
// is sellable; a selectable shop slot switches to it. Clicking another
// dwarf's whole slot changes nothing: while a dwarf is held, every other
// dwarf's targets are its zones (Phase 16), and the UI disables its whole
// slot.
//
// A roster slot zone (Phase 16) is resolved by resolveRosterSlotZoneClick,
// before any of the above.
export function resolveCampClick(
  campSelection: CampSelection,
  campClickTarget: CampClickTarget,
  campState: CampState,
  characterTemplates: readonly CharacterTemplate[],
): CampClickResolution {
  const unchanged: CampClickResolution = {
    nextCampSelection: campSelection,
    campIntentToSubmit: null,
  };

  if (campClickTarget.targetKind === "rosterSlotZone") {
    return resolveRosterSlotZoneClick(
      campSelection,
      campClickTarget,
      campState.campRoster,
    );
  }

  if (campSelection.selectionKind === "none") {
    if (campClickTarget.targetKind === "moneyPile") {
      // Nothing is held, so there is nothing to sell.
      return unchanged;
    }

    if (campClickTarget.targetKind === "characterShopSlot") {
      if (
        isCharacterShopSlotSelectable(
          campState,
          characterTemplates,
          campClickTarget.shopSlotIndex,
        )
      ) {
        return {
          nextCampSelection: {
            selectionKind: "characterShopSlot",
            shopSlotIndex: campClickTarget.shopSlotIndex,
          },
          campIntentToSubmit: null,
        };
      }
      return unchanged;
    }

    // campClickTarget.targetKind === "rosterSlot"
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

  if (campSelection.selectionKind === "characterShopSlot") {
    if (campClickTarget.targetKind === "moneyPile") {
      // A shop character isn't owned yet, so it can't be sold.
      return unchanged;
    }

    if (campClickTarget.targetKind === "characterShopSlot") {
      if (campClickTarget.shopSlotIndex === campSelection.shopSlotIndex) {
        return { nextCampSelection: noSelection, campIntentToSubmit: null };
      }
      if (
        isCharacterShopSlotSelectable(
          campState,
          characterTemplates,
          campClickTarget.shopSlotIndex,
        )
      ) {
        return {
          nextCampSelection: {
            selectionKind: "characterShopSlot",
            shopSlotIndex: campClickTarget.shopSlotIndex,
          },
          campIntentToSubmit: null,
        };
      }
      return unchanged;
    }

    // campClickTarget.targetKind === "rosterSlot"
    if (
      isBuyTargetSlot(
        campState,
        characterTemplates,
        campSelection.shopSlotIndex,
        campClickTarget.slotIndex,
      )
    ) {
      return {
        nextCampSelection: noSelection,
        campIntentToSubmit: {
          intentKind: "buyCharacter",
          shopSlotIndex: campSelection.shopSlotIndex,
          targetRosterSlotIndex: campClickTarget.slotIndex,
        },
      };
    }
    return unchanged;
  }

  // campSelection.selectionKind === "rosterSlot"
  if (campClickTarget.targetKind === "moneyPile") {
    if (isSellableRosterSlot(campState.campRoster, campSelection.slotIndex)) {
      return {
        nextCampSelection: noSelection,
        campIntentToSubmit: {
          intentKind: "sellCharacter",
          slotIndex: campSelection.slotIndex,
        },
      };
    }
    return unchanged;
  }

  if (campClickTarget.targetKind === "rosterSlot") {
    if (campClickTarget.slotIndex === campSelection.slotIndex) {
      return { nextCampSelection: noSelection, campIntentToSubmit: null };
    }

    // Another dwarf's whole slot: its zones are the targets (see above).
    // This is a routing decision between target kinds, not a rule check —
    // the reposition rule below still decides whether the move is allowed.
    if (campState.campRoster[campClickTarget.slotIndex] !== null) {
      return unchanged;
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

  // campClickTarget.targetKind === "characterShopSlot"
  if (
    isCharacterShopSlotSelectable(
      campState,
      characterTemplates,
      campClickTarget.shopSlotIndex,
    )
  ) {
    return {
      nextCampSelection: {
        selectionKind: "characterShopSlot",
        shopSlotIndex: campClickTarget.shopSlotIndex,
      },
      campIntentToSubmit: null,
    };
  }
  return unchanged;
}

function isSameCampSelection(
  firstCampSelection: CampSelection,
  secondCampSelection: CampSelection,
): boolean {
  if (firstCampSelection.selectionKind !== secondCampSelection.selectionKind) {
    return false;
  }
  if (
    firstCampSelection.selectionKind === "characterShopSlot" &&
    secondCampSelection.selectionKind === "characterShopSlot"
  ) {
    return firstCampSelection.shopSlotIndex === secondCampSelection.shopSlotIndex;
  }
  if (
    firstCampSelection.selectionKind === "rosterSlot" &&
    secondCampSelection.selectionKind === "rosterSlot"
  ) {
    return firstCampSelection.slotIndex === secondCampSelection.slotIndex;
  }
  return true;
}

// UI tiles are enabled exactly when their click is effective, so disabled
// state can't disagree with click behaviour.
export function isCampClickEffective(
  campSelection: CampSelection,
  campClickTarget: CampClickTarget,
  campState: CampState,
  characterTemplates: readonly CharacterTemplate[],
): boolean {
  const { nextCampSelection, campIntentToSubmit } = resolveCampClick(
    campSelection,
    campClickTarget,
    campState,
    characterTemplates,
  );

  return (
    campIntentToSubmit !== null ||
    !isSameCampSelection(campSelection, nextCampSelection)
  );
}

// A drop is "select the dragged item, then click the target", so drops
// obey exactly the same rules and hints as click-select.
export function resolveCampDrop(
  dragSourceSelection: CampSelection,
  dropTarget: CampClickTarget,
  campState: CampState,
  characterTemplates: readonly CharacterTemplate[],
): CampIntent | null {
  return resolveCampClick(
    dragSourceSelection,
    dropTarget,
    campState,
    characterTemplates,
  ).campIntentToSubmit;
}

export type CampTargetPresentation =
  | "held"
  | "eligible"
  | "mergeTarget"
  | "ineligible"
  | "neutral";

// This is the single source of every tile's hint, so click-select and drag
// can't present differently. With nothing in hand, a tile that holds a
// pick-up-able item (an offering shop slot, or an occupied roster slot)
// shows whether it can be picked up; an empty slot holds nothing to pick
// up, so it just looks empty ("neutral"); the money pile holds nothing to
// pick up either, so it's "ineligible" rather than neutral — there's
// nothing to sell. A buy-target roster slot that would merge, rather than
// place, presents as "mergeTarget" instead of "eligible". A submitted
// sellCharacter intent presents as "eligible" (the shared fallthrough
// below); the money pile is otherwise "ineligible". With a dwarf in hand,
// another dwarf's whole slot is "ineligible" (clicking it does nothing);
// the UI draws its zones instead (presentRosterSlotZones) and ignores this.
export function presentCampTarget(
  heldCampItem: CampSelection,
  campClickTarget: CampClickTarget,
  campState: CampState,
  characterTemplates: readonly CharacterTemplate[],
): CampTargetPresentation {
  if (campClickTarget.targetKind === "rosterSlotZone") {
    // A programmer error: a zone's two halves have their own presentations.
    throw new Error(
      "A roster slot zone is presented by presentRosterSlotZones, not presentCampTarget.",
    );
  }

  if (heldCampItem.selectionKind === "none") {
    if (campClickTarget.targetKind === "characterShopSlot") {
      return isCharacterShopSlotSelectable(
        campState,
        characterTemplates,
        campClickTarget.shopSlotIndex,
      )
        ? "neutral"
        : "ineligible";
    }

    if (campClickTarget.targetKind === "moneyPile") {
      // Nothing is held, so there is nothing to sell.
      return "ineligible";
    }

    // campClickTarget.targetKind === "rosterSlot"
    if (campState.campRoster[campClickTarget.slotIndex] === null) {
      return "neutral";
    }

    return isRosterSlotSelectable(
      campState.campRoster,
      campClickTarget.slotIndex,
    )
      ? "neutral"
      : "ineligible";
  }

  const isHeldTarget =
    (heldCampItem.selectionKind === "characterShopSlot" &&
      campClickTarget.targetKind === "characterShopSlot" &&
      heldCampItem.shopSlotIndex === campClickTarget.shopSlotIndex) ||
    (heldCampItem.selectionKind === "rosterSlot" &&
      campClickTarget.targetKind === "rosterSlot" &&
      heldCampItem.slotIndex === campClickTarget.slotIndex);

  if (isHeldTarget) {
    return "held";
  }

  const { campIntentToSubmit } = resolveCampClick(
    heldCampItem,
    campClickTarget,
    campState,
    characterTemplates,
  );

  if (campIntentToSubmit !== null) {
    if (campIntentToSubmit.intentKind === "buyCharacter") {
      const buyPreview = previewBuyCharacterFromShopSlot(
        campState,
        characterTemplates,
        campIntentToSubmit.shopSlotIndex,
        campIntentToSubmit.targetRosterSlotIndex,
      );

      if (
        buyPreview.outcome === "accepted" &&
        buyPreview.acceptanceKind === "merged"
      ) {
        return "mergeTarget";
      }
    }

    return "eligible";
  }

  if (
    isCampClickEffective(
      heldCampItem,
      campClickTarget,
      campState,
      characterTemplates,
    )
  ) {
    return "neutral";
  }

  return "ineligible";
}

// "Matching" is read from the real rules' previews (the
// rosterSlotAtMaxLevel / targetSlotAtMaxLevel rejections are only ever
// returned for a matching occupant) — never from a client-side template-id
// comparison. Only a shop hold matches here: with a roster dwarf in hand,
// every other dwarf shows its split zones (Phase 16), and the merge zone
// shows the match instead (presentRosterSlotZones).
export function isRosterSlotMatchingHeldItem(
  heldCampItem: CampSelection,
  rosterSlotIndex: number,
  campState: CampState,
  characterTemplates: readonly CharacterTemplate[],
): boolean {
  if (heldCampItem.selectionKind === "characterShopSlot") {
    const buyPreview = previewBuyCharacterFromShopSlot(
      campState,
      characterTemplates,
      heldCampItem.shopSlotIndex,
      rosterSlotIndex,
    );

    return (
      (buyPreview.outcome === "accepted" &&
        buyPreview.acceptanceKind === "merged") ||
      (buyPreview.outcome === "rejected" &&
        buyPreview.rejectionReason === "rosterSlotAtMaxLevel")
    );
  }

  return false;
}

export type RosterSlotZonePresentation = "eligible" | "ineligible";

export type RosterSlotMergeZonePresentation =
  | RosterSlotZonePresentation
  | "atMaxLevel";

export type RosterSlotZonesPresentation =
  | { zonesShown: false }
  | {
      zonesShown: true;
      swapZonePresentation: RosterSlotZonePresentation;
      mergeZonePresentation: RosterSlotMergeZonePresentation;
    };

// Phase 16. Zones show on every dwarf other than the held one while a
// roster dwarf is held; never for a shop hold (it keeps the whole-card
// target), nor on an empty slot (a whole-slot move target). Each half's
// presentation comes from what clicking it would do (resolveCampClick), so
// a zone can't look different from how it acts. "atMaxLevel" is read from
// the merge rule's targetSlotAtMaxLevel rejection, which is only ever
// returned for a matching occupant — never from a template comparison.
export function presentRosterSlotZones(
  heldCampItem: CampSelection,
  rosterSlotIndex: number,
  campState: CampState,
  characterTemplates: readonly CharacterTemplate[],
): RosterSlotZonesPresentation {
  if (
    heldCampItem.selectionKind !== "rosterSlot" ||
    heldCampItem.slotIndex === rosterSlotIndex ||
    campState.campRoster[rosterSlotIndex] === null
  ) {
    return { zonesShown: false };
  }

  const swapZoneIntent = resolveCampClick(
    heldCampItem,
    {
      targetKind: "rosterSlotZone",
      slotIndex: rosterSlotIndex,
      zoneKind: "swap",
    },
    campState,
    characterTemplates,
  ).campIntentToSubmit;
  const mergeZoneIntent = resolveCampClick(
    heldCampItem,
    {
      targetKind: "rosterSlotZone",
      slotIndex: rosterSlotIndex,
      zoneKind: "merge",
    },
    campState,
    characterTemplates,
  ).campIntentToSubmit;

  const swapZonePresentation: RosterSlotZonePresentation =
    swapZoneIntent !== null ? "eligible" : "ineligible";

  let mergeZonePresentation: RosterSlotMergeZonePresentation = "ineligible";
  if (mergeZoneIntent !== null) {
    mergeZonePresentation = "eligible";
  } else {
    const mergePreview = mergeRosterCharacters(
      campState.campRoster,
      heldCampItem.slotIndex,
      rosterSlotIndex,
    );
    if (
      mergePreview.outcome === "rejected" &&
      mergePreview.rejectionReason === "targetSlotAtMaxLevel"
    ) {
      mergeZonePresentation = "atMaxLevel";
    }
  }

  return { zonesShown: true, swapZonePresentation, mergeZonePresentation };
}
