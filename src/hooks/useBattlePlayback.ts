import { useEffect, useState } from "react";
import type { ResolvedBattle } from "@/lib/battle/types";
import { deriveBattlePlaybackState } from "@/lib/battle/deriveBattlePlaybackState";
import { beatDurationMs } from "@/lib/battle/beatDurationMs";

export function useBattlePlayback(resolvedBattle: ResolvedBattle) {
  const [playbackBeat, setPlaybackBeat] = useState(-1); // -1 = nothing applied yet
  const [viewingBeat, setViewingBeat] = useState(-1); // -1 = no beat displayed yet
  const [isPlaying, setIsPlaying] = useState(false);

  const highestBeat = Math.max(
    ...resolvedBattle.events.map((event) => event.beatIndex),
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
    setViewingBeat((currentViewingBeat) => Math.max(currentViewingBeat - 1, 0));
  };

  const viewNextBeat = () => {
    setViewingBeat((currentViewingBeat) =>
      Math.min(currentViewingBeat + 1, playbackBeat),
    );
  };

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);

  // The effect depends on playbackBeat so it tears down and re-creates the
  // timeout on every tick, keeping the timeout's closure fresh rather than
  // reading a stale playbackBeat from a timer that outlives many renders.
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    if (view.isFinished) {
      setIsPlaying(false);
      return;
    }

    const currentBeatEvents = resolvedBattle.events.filter(
      (event) => event.beatIndex === playbackBeat,
    );

    const timeoutId = setTimeout(() => {
      const nextPlaybackBeat = Math.min(playbackBeat + 1, highestBeat);
      setPlaybackBeat(nextPlaybackBeat);
      setViewingBeat(nextPlaybackBeat);
    }, beatDurationMs(currentBeatEvents));

    return () => clearTimeout(timeoutId);
  }, [
    isPlaying,
    view.isFinished,
    playbackBeat,
    highestBeat,
    resolvedBattle.events,
  ]);

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
