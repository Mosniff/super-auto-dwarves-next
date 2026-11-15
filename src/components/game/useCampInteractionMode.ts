"use client";

import { useCallback, useEffect, useReducer } from "react";
import type { CampInteractionMode } from "./campSelection";
import {
  campInteractionModeFromState,
  initialCampInteractionModeState,
  reduceCampInteractionModeState,
} from "./campInteractionMode";

interface UseCampInteractionModeResult {
  campInteractionMode: CampInteractionMode;
  isMergeSellToggleLatched: boolean;
  onMergeSellToggleClick: () => void;
}

// The mode is client UI state only (CampInteractionMode's own comment) —
// the server never receives or learns it, only the explicit intent
// (reposition vs. mergeCharacters) it caused the player to submit.
//
// A key-up can be missed entirely (the window loses focus while the key
// is down, or the tab is hidden), which would otherwise leave the mode
// stuck in merge/sell with no way for the player to release it by
// keyboard. window's blur and document's visibilitychange both clear a
// held Shift as a safety net, mirroring the reducer's focusLost event.
export function useCampInteractionMode(): UseCampInteractionModeResult {
  const [campInteractionModeState, dispatchCampInteractionModeEvent] =
    useReducer(reduceCampInteractionModeState, initialCampInteractionModeState);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Shift" && !event.repeat) {
        dispatchCampInteractionModeEvent({ eventKind: "shiftPressed" });
        return;
      }
      if (event.key === "Tab") {
        dispatchCampInteractionModeEvent({ eventKind: "tabPressed" });
      }
    }

    function handleKeyUp(event: KeyboardEvent): void {
      if (event.key === "Shift") {
        dispatchCampInteractionModeEvent({ eventKind: "shiftReleased" });
      }
    }

    function handleWindowBlur(): void {
      dispatchCampInteractionModeEvent({ eventKind: "focusLost" });
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState === "hidden") {
        dispatchCampInteractionModeEvent({ eventKind: "focusLost" });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const onMergeSellToggleClick = useCallback(() => {
    dispatchCampInteractionModeEvent({ eventKind: "mergeSellToggleClicked" });
  }, []);

  return {
    campInteractionMode: campInteractionModeFromState(campInteractionModeState),
    isMergeSellToggleLatched: campInteractionModeState.isMergeSellToggleLatched,
    onMergeSellToggleClick,
  };
}
