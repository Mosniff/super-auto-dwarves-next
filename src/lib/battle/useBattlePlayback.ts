import { useState } from "react";
import type { ResolvedBattle } from "./types";
import { deriveBattlePlaybackState } from "./deriveBattlePlaybackState";

export function useBattlePlayback(resolvedBattle: ResolvedBattle) {
  const [position, setPosition] = useState(-1); // -1 = nothing applied yet

  const view = deriveBattlePlaybackState(resolvedBattle, position);

  const advance = () => {
    setPosition((currentPosition) => {
      // don't advance past the last event
      if (currentPosition >= resolvedBattle.events.length - 1) {
        return currentPosition;
      }
      return currentPosition + 1;
    });
  };

  return {
    currentState: view.currentState,
    logLines: view.logLines,
    isFinished: view.isFinished,
    advance,
  };
}
