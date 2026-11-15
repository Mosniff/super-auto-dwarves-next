import type { CampInteractionMode } from "./campSelection";

export interface CampInteractionModeState {
  isMergeSellToggleLatched: boolean;
  isShiftHeld: boolean;
  isShiftSuppressedUntilRelease: boolean;
}

export type CampInteractionModeEvent =
  | { eventKind: "shiftPressed" }
  | { eventKind: "shiftReleased" }
  | { eventKind: "tabPressed" }
  | { eventKind: "mergeSellToggleClicked" }
  | { eventKind: "focusLost" };

export const initialCampInteractionModeState: CampInteractionModeState = {
  isMergeSellToggleLatched: false,
  isShiftHeld: false,
  isShiftSuppressedUntilRelease: false,
};

// Two separate inputs, kept as separate fields rather than folded into one:
// the latch (mergeSellToggleClicked) and the held Shift key each turn the
// mode on independently, but releasing Shift must never turn off a
// latched mode — collapsing them into one boolean would lose that.
//
// isShiftSuppressedUntilRelease encodes the ruling that Shift+Tab is
// keyboard focus navigation, not a request to enter merge/sell mode: Tab
// clears isShiftHeld and arms the suppression, and a further shiftPressed
// is ignored while it's armed, so the still-physically-held key can't
// re-enter the mode until it's actually released.
//
// focusLost (window blur, or the page becoming hidden) clears both Shift
// fields — a window losing focus can mean the key-up event never reaches
// us — but deliberately leaves the latch alone: losing focus is not the
// player asking to leave merge/sell mode.
export function reduceCampInteractionModeState(
  state: CampInteractionModeState,
  event: CampInteractionModeEvent,
): CampInteractionModeState {
  switch (event.eventKind) {
    case "shiftPressed":
      if (state.isShiftSuppressedUntilRelease) {
        return state;
      }
      return { ...state, isShiftHeld: true };
    case "tabPressed":
      if (!state.isShiftHeld) {
        return state;
      }
      return {
        ...state,
        isShiftHeld: false,
        isShiftSuppressedUntilRelease: true,
      };
    case "shiftReleased":
      return {
        ...state,
        isShiftHeld: false,
        isShiftSuppressedUntilRelease: false,
      };
    case "mergeSellToggleClicked":
      return {
        ...state,
        isMergeSellToggleLatched: !state.isMergeSellToggleLatched,
      };
    case "focusLost":
      return {
        ...state,
        isShiftHeld: false,
        isShiftSuppressedUntilRelease: false,
      };
  }
}

// The interaction mode never affects a shop hold (a shop card buys or
// merge-buys in either mode), so while one is held the UI mustn't suggest
// Shift does anything — Shift is ignored. The latch is kept, per the
// human: a latched toggle still reports "mergeOrSell" while disabled.
export function campInteractionModeFromState(
  state: CampInteractionModeState,
  isShopCharacterHeld: boolean = false,
): CampInteractionMode {
  if (isShopCharacterHeld) {
    return state.isMergeSellToggleLatched ? "mergeOrSell" : "reposition";
  }

  return state.isMergeSellToggleLatched || state.isShiftHeld
    ? "mergeOrSell"
    : "reposition";
}
