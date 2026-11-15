import {
  buyCharacterFromShopSlot,
  type BuyCharacterFromShopSlotResult,
} from "@/lib/game/buyCharacterFromShopSlot";
import { repositionCharacter } from "@/lib/game/repositionCharacter";
import { mergeRosterCharacters } from "@/lib/game/mergeRosterCharacters";
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

// Client UI state only (Part 2 wires this up): default mode leaves a held
// roster dwarf repositioning; "mergeOrSell" turns matches into merge
// targets instead. The server never receives or learns this — it only ever
// sees the explicit intent (reposition vs. mergeCharacters) that the mode
// caused the player to submit.
export type CampInteractionMode = "reposition" | "mergeOrSell";

export type CampClickTarget =
  | { targetKind: "characterShopSlot"; shopSlotIndex: number }
  | { targetKind: "rosterSlot"; slotIndex: number };

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
    };

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

// In "reposition" (the default), a slot is selectable when some other slot
// is a reposition target for it. In "mergeOrSell", a slot is selectable
// when some other slot is a merge target for it instead — repositioning is
// off in this mode.
export function isRosterSlotSelectable(
  campRoster: CampRoster,
  slotIndex: number,
  campInteractionMode: CampInteractionMode = "reposition",
): boolean {
  if (campInteractionMode === "mergeOrSell") {
    return allCampRosterSlotIndices.some(
      (otherSlotIndex) =>
        otherSlotIndex !== slotIndex &&
        isMergeTargetSlot(campRoster, slotIndex, otherSlotIndex),
    );
  }

  return allCampRosterSlotIndices.some(
    (otherSlotIndex) =>
      otherSlotIndex !== slotIndex &&
      isRepositionTargetSlot(campRoster, slotIndex, otherSlotIndex),
  );
}

const noSelection: CampSelection = { selectionKind: "none" };

// Nothing selected: a selectable character shop slot or roster slot becomes
// selected; anything else changes nothing.
//
// A character shop slot selected: clicking the same slot clears; a
// different selectable shop slot switches; a buy-target roster slot
// submits a buy and clears; any other roster slot click changes nothing
// (buying and repositioning are separate actions on separate kinds of
// selection, so an occupied, non-buyable slot is never itself picked up
// here — this asymmetry is what lets the merge-buy rule turn a click on a
// matching dwarf into a buy with no change here).
//
// A roster slot selected: clicking the same slot clears. In "reposition"
// mode, a reposition-target slot submits a reposition and clears; in
// "mergeOrSell" mode, a merge-target slot submits a mergeCharacters intent
// and clears instead, and repositioning is off. Either mode: a selectable
// shop slot switches to it; any other roster slot click changes nothing.
//
// campInteractionMode is client UI state only (CampInteractionMode's own
// comment) — the server never receives or learns it, only the explicit
// intent (reposition vs. mergeCharacters) it caused the player to submit.
export function resolveCampClick(
  campSelection: CampSelection,
  campClickTarget: CampClickTarget,
  campState: CampState,
  characterTemplates: readonly CharacterTemplate[],
  campInteractionMode: CampInteractionMode = "reposition",
): CampClickResolution {
  const unchanged: CampClickResolution = {
    nextCampSelection: campSelection,
    campIntentToSubmit: null,
  };

  if (campSelection.selectionKind === "none") {
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

    if (
      isRosterSlotSelectable(
        campState.campRoster,
        campClickTarget.slotIndex,
        campInteractionMode,
      )
    ) {
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
  if (campClickTarget.targetKind === "rosterSlot") {
    if (campClickTarget.slotIndex === campSelection.slotIndex) {
      return { nextCampSelection: noSelection, campIntentToSubmit: null };
    }

    if (campInteractionMode === "mergeOrSell") {
      if (
        isMergeTargetSlot(
          campState.campRoster,
          campSelection.slotIndex,
          campClickTarget.slotIndex,
        )
      ) {
        return {
          nextCampSelection: noSelection,
          campIntentToSubmit: {
            intentKind: "mergeCharacters",
            fromSlotIndex: campSelection.slotIndex,
            intoSlotIndex: campClickTarget.slotIndex,
          },
        };
      }
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
  campInteractionMode: CampInteractionMode = "reposition",
): boolean {
  const { nextCampSelection, campIntentToSubmit } = resolveCampClick(
    campSelection,
    campClickTarget,
    campState,
    characterTemplates,
    campInteractionMode,
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
  campInteractionMode: CampInteractionMode = "reposition",
): CampIntent | null {
  return resolveCampClick(
    dragSourceSelection,
    dropTarget,
    campState,
    characterTemplates,
    campInteractionMode,
  ).campIntentToSubmit;
}

export type CampTargetPresentation =
  | "held"
  | "eligible"
  | "mergeTarget"
  | "swapTarget"
  | "ineligible"
  | "neutral";

// This is the single source of every tile's hint, so click-select and drag
// can't present differently. With nothing in hand, a tile that holds a
// pick-up-able item (an offering shop slot, or an occupied roster slot)
// shows whether it can be picked up; an empty slot holds nothing to pick
// up, so it just looks empty ("neutral"). A buy-target roster slot that
// would merge, rather than place, presents as "mergeTarget" instead of
// "eligible". A reposition-target roster slot that already holds a dwarf
// presents as "swapTarget" instead of "eligible" — placing here swaps the
// two dwarves. It's derived from the reposition intent the click would
// submit, plus the target slot holding a dwarf: the same roster data the
// reposition rule itself swaps on, never a template comparison.
export function presentCampTarget(
  heldCampItem: CampSelection,
  campClickTarget: CampClickTarget,
  campState: CampState,
  characterTemplates: readonly CharacterTemplate[],
  campInteractionMode: CampInteractionMode = "reposition",
): CampTargetPresentation {
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

    if (campState.campRoster[campClickTarget.slotIndex] === null) {
      return "neutral";
    }

    return isRosterSlotSelectable(
      campState.campRoster,
      campClickTarget.slotIndex,
      campInteractionMode,
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
    campInteractionMode,
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

    if (campIntentToSubmit.intentKind === "mergeCharacters") {
      return "mergeTarget";
    }

    if (
      campIntentToSubmit.intentKind === "reposition" &&
      campState.campRoster[campIntentToSubmit.toSlotIndex] !== null
    ) {
      return "swapTarget";
    }

    return "eligible";
  }

  if (
    isCampClickEffective(
      heldCampItem,
      campClickTarget,
      campState,
      characterTemplates,
      campInteractionMode,
    )
  ) {
    return "neutral";
  }

  return "ineligible";
}

// "Matching" is read from the real rules' previews (the
// rosterSlotAtMaxLevel / targetSlotAtMaxLevel rejections are only ever
// returned for a matching occupant) — never from a client-side
// characterTemplateId comparison. A shop hold's matching is unaffected by
// the mode (a merge-buy can always happen); a roster hold's matching is
// mode-aware, because in "reposition" mode the player is moving the dwarf,
// not merging it, so nothing should look like a merge target there.
export function isRosterSlotMatchingHeldItem(
  heldCampItem: CampSelection,
  rosterSlotIndex: number,
  campState: CampState,
  characterTemplates: readonly CharacterTemplate[],
  campInteractionMode: CampInteractionMode = "reposition",
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

  if (
    heldCampItem.selectionKind === "rosterSlot" &&
    campInteractionMode === "mergeOrSell"
  ) {
    const mergePreview = mergeRosterCharacters(
      campState.campRoster,
      heldCampItem.slotIndex,
      rosterSlotIndex,
    );

    return (
      mergePreview.outcome === "accepted" ||
      (mergePreview.outcome === "rejected" &&
        mergePreview.rejectionReason === "targetSlotAtMaxLevel")
    );
  }

  return false;
}
