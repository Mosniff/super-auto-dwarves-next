import { useEffect, useState } from "react";
import type { ResolvedBattle } from "@/lib/battle/types";
import { deriveBattlePlaybackState } from "@/lib/battle/deriveBattlePlaybackState";

const AUTOPLAY_INTERVAL_MS = 800;

export function useBattlePlayback(resolvedBattle: ResolvedBattle) {
  const [playbackBeat, setPlaybackBeat] = useState(-1); // -1 = nothing applied yet
  const [viewingBeat, setViewingBeat] = useState(-1); // -1 = no beat displayed yet
  const [isPlaying, setIsPlaying] = useState(false);

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

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);

  // The effect depends on playbackBeat so it tears down and re-creates the
  // interval on every tick, keeping the interval's closure fresh rather than
  // reading a stale playbackBeat from an interval that outlives many renders.
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    if (view.isFinished) {
      setIsPlaying(false);
      return;
    }

    const intervalId = setInterval(() => {
      const nextPlaybackBeat = Math.min(playbackBeat + 1, highestBeat);
      setPlaybackBeat(nextPlaybackBeat);
      setViewingBeat(nextPlaybackBeat);
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isPlaying, view.isFinished, playbackBeat, highestBeat]);

  return {
    currentState: view.currentState,
    currentBeatLines: view.currentBeatLines,
    isFinished: view.isFinished,
    advance,
    viewPreviousBeat,
    viewNextBeat,
    canViewPrevious: viewingBeat > 0,
    canViewNext: viewingBeat < playbackBeat,
    isPlaying,
    play,
    pause,
  };
}
