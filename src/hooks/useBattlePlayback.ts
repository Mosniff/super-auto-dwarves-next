import { useEffect, useRef, useState } from "react";
import type { ResolvedBattle } from "@/lib/battle/types";
import { deriveBattlePlaybackState } from "@/lib/battle/deriveBattlePlaybackState";
import { beatDurationMs } from "@/lib/battle/beatDurationMs";

export function useBattlePlayback(resolvedBattle: ResolvedBattle) {
  const [playbackBeat, setPlaybackBeat] = useState(-1); // -1 = nothing applied yet
  const [viewingBeat, setViewingBeat] = useState(-1); // -1 = no beat displayed yet
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAdvanceLocked, setIsAdvanceLocked] = useState(false);
  const advanceLockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const highestBeat = Math.max(
    ...resolvedBattle.events.map((event) => event.beatIndex),
  );

  const view = deriveBattlePlaybackState(
    resolvedBattle,
    playbackBeat,
    viewingBeat,
  );

  // Manual advancing is locked while a beat's animation is still playing, or
  // while autoplaying (autoplay is the "go faster" path), or once finished.
  const canAdvance = !isAdvanceLocked && !isPlaying && !view.isFinished;

  const advance = () => {
    // backstop so the invariant holds regardless of caller
    if (!canAdvance) {
      return;
    }

    // don't advance past the last beat
    const nextPlaybackBeat = Math.min(playbackBeat + 1, highestBeat);
    setPlaybackBeat(nextPlaybackBeat);
    // advancing always snaps the view forward, even if the user was browsing history
    setViewingBeat(nextPlaybackBeat);

    const advancedBeatType = resolvedBattle.events.find(
      (event) => event.beatIndex === nextPlaybackBeat,
    )?.beatType;

    setIsAdvanceLocked(true);
    if (advanceLockTimeoutRef.current !== null) {
      clearTimeout(advanceLockTimeoutRef.current);
    }
    advanceLockTimeoutRef.current = setTimeout(() => {
      setIsAdvanceLocked(false);
      advanceLockTimeoutRef.current = null;
    }, beatDurationMs(advancedBeatType));
  };

  // Cleanup-only effect so the lock timer can't fire after unmount — mirrors
  // the autoplay timer's cleanup discipline.
  useEffect(() => {
    return () => {
      if (advanceLockTimeoutRef.current !== null) {
        clearTimeout(advanceLockTimeoutRef.current);
      }
    };
  }, []);

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

    const currentBeatType = resolvedBattle.events.find(
      (event) => event.beatIndex === playbackBeat,
    )?.beatType;

    const timeoutId = setTimeout(() => {
      const nextPlaybackBeat = Math.min(playbackBeat + 1, highestBeat);
      setPlaybackBeat(nextPlaybackBeat);
      setViewingBeat(nextPlaybackBeat);
    }, beatDurationMs(currentBeatType));

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
    currentBeatType: view.currentBeatType,
    isFinished: view.isFinished,
    advance,
    canAdvance,
    viewPreviousBeat,
    viewNextBeat,
    canViewPrevious: viewingBeat > 0,
    canViewNext: viewingBeat < playbackBeat,
    isPlaying,
    play,
    pause,
  };
}
