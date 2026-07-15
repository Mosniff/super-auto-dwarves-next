import { useState } from "react";
import type { ResolvedBattle } from "@/lib/battle/types";
import { deriveBattlePlaybackState } from "@/lib/battle/deriveBattlePlaybackState";

export function useBattlePlayback(resolvedBattle: ResolvedBattle) {
  const [playbackBeat, setPlaybackBeat] = useState(-1); // -1 = nothing applied yet
  const [viewingBeat, setViewingBeat] = useState(-1); // -1 = no beat displayed yet

  const highestBeat = Math.max(
    ...resolvedBattle.events.map((event) => event.beat),
  );

  const view = deriveBattlePlaybackState(
    resolvedBattle,
    playbackBeat,
    viewingBeat,
  );

  const advance = () => {
    // don't advance past the last beat
    const nextPlaybackBeat = Math.min(playbackBeat + 1, highestBeat);
    setPlaybackBeat(nextPlaybackBeat);
    // advancing always snaps the view forward, even if the user was browsing history
    setViewingBeat(nextPlaybackBeat);
  };

  const viewPreviousBeat = () => {
    setViewingBeat((currentViewingBeat) =>
      Math.max(currentViewingBeat - 1, 0),
    );
  };

  const viewNextBeat = () => {
    setViewingBeat((currentViewingBeat) =>
      Math.min(currentViewingBeat + 1, playbackBeat),
    );
  };

  return {
    currentState: view.currentState,
    currentBeatLines: view.currentBeatLines,
    isFinished: view.isFinished,
    advance,
    viewPreviousBeat,
    viewNextBeat,
    canViewPrevious: viewingBeat > 0,
    canViewNext: viewingBeat < playbackBeat,
  };
}
