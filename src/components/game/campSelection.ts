import { buyCharacterFromShopSlot } from "@/lib/game/buyCharacterFromShopSlot";
import { repositionCharacter } from "@/lib/game/repositionCharacter";
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

export type CampClickTarget =
  | { targetKind: "characterShopSlot"; shopSlotIndex: number }
  | { targetKind: "rosterSlot"; slotIndex: number };

export type CampIntent =
  | {
      intentKind: "buyCharacter";
      shopSlotIndex: number;
      targetRosterSlotIndex: number;
    }
  | { intentKind: "reposition"; fromSlotIndex: number; toSlotIndex: number };

export interface CampClickResolution {
  nextCampSelection: CampSelection;
  campIntentToSubmit: CampIntent | null;
}

// Never actually used as an id — only buyCharacterFromShopSlot's outcome is
// read, and nothing it returns here is kept or saved.
const SELECTION_PREVIEW_CHARACTER_ID = "selection-preview-character";

const allCampRosterSlotIndices = Array.from(
  { length: CAMP_ROSTER_SLOT_COUNT },
  (_, slotIndex) => slotIndex,
);

export function isBuyTargetSlot(
  campState: CampState,
  characterTemplates: readonly CharacterTemplate[],
  shopSlotIndex: number,
  rosterSlotIndex: number,
): boolean {
  return (
    buyCharacterFromShopSlot(
      campState,
      characterTemplates,
      shopSlotIndex,
      rosterSlotIndex,
      SELECTION_PREVIEW_CHARACTER_ID,
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

// Nothing selected: a selectable character shop slot or roster slot becomes
// selected; anything else changes nothing.
//
// A character shop slot selected: clicking the same slot clears; a
// different selectable shop slot switches; a buy-target roster slot
// submits a buy and clears; any other roster slot click changes nothing
// (buying and repositioning are separate actions on separate kinds of
// selection, so an occupied, non-buyable slot is never itself picked up
// here — this is the deliberate asymmetry: a future "promotion" rule
// accepting a buy onto an occupied slot would turn that click into a buy
// without any change here).
//
// A roster slot selected: clicking the same slot clears; a
// reposition-target slot submits a reposition and clears; a selectable
// shop slot switches to it; any other roster slot click changes nothing.
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
  | "ineligible"
  | "neutral";

// This is the single source of every tile's hint, so click-select and drag
// can't present differently. With nothing in hand, a tile that holds a
// pick-up-able item (an offering shop slot, or an occupied roster slot)
// shows whether it can be picked up; an empty slot holds nothing to pick
// up, so it just looks empty ("neutral").
export function presentCampTarget(
  heldCampItem: CampSelection,
  campClickTarget: CampClickTarget,
  campState: CampState,
  characterTemplates: readonly CharacterTemplate[],
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
