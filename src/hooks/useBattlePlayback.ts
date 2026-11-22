import { useEffect, useRef, useState } from "react";
import type { ResolvedBattle } from "@/lib/battle/types";
import type { Character } from "@/lib/game/character";
import { deriveBattlePlaybackState } from "@/lib/battle/deriveBattlePlaybackState";
import {
  autoplayBeatDelayMs,
  beatDurationMs,
} from "@/lib/battle/beatDurationMs";
import type { AutoplaySpeed } from "@/lib/battle/autoplaySpeed";

export function useBattlePlayback(
  resolvedBattle: ResolvedBattle,
  // translated names for the battle log (Phase 13)
  displayCharacterName?: (character: Character) => string,
) {
  const [playbackBeat, setPlaybackBeat] = useState(-1); // -1 = nothing applied yet
  const [viewingBeat, setViewingBeat] = useState(-1); // -1 = no beat displayed yet
  // Autoplay is on at Slow or Fast (Phase 14); Off is paused.
  const [autoplaySpeed, setAutoplaySpeed] = useState<AutoplaySpeed>("off");
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
    displayCharacterName,
  );

  // Playing means a speed is chosen and beats remain (Phase 14).
  const isPlaying = autoplaySpeed !== "off" && !view.isFinished;

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

  // play() is Fast, today's pace; pause() is Off (the "i" controls use it).
  const play = () => setAutoplaySpeed("fast");
  const pause = () => setAutoplaySpeed("off");

  // The effect depends on playbackBeat so it tears down and re-creates the
  // timeout on every tick, keeping the timeout's closure fresh rather than
  // reading a stale playbackBeat from a timer that outlives many renders.
  // At Slow the wait between beats is stretched (autoplayBeatDelayMs); at
  // the battle's end playback stops, keeping the chosen speed (Phase 14).
  useEffect(() => {
    // At the end playback simply stops; the chosen speed stays selected.
    if (autoplaySpeed === "off" || view.isFinished) {
      return;
    }

    const currentBeatType = resolvedBattle.events.find(
      (event) => event.beatIndex === playbackBeat,
    )?.beatType;

    const timeoutId = setTimeout(() => {
      const nextPlaybackBeat = Math.min(playbackBeat + 1, highestBeat);
      setPlaybackBeat(nextPlaybackBeat);
      setViewingBeat(nextPlaybackBeat);
    }, autoplayBeatDelayMs(currentBeatType, autoplaySpeed));

    return () => clearTimeout(timeoutId);
  }, [
    autoplaySpeed,
    view.isFinished,
    playbackBeat,
    highestBeat,
    resolvedBattle.events,
  ]);

  return {
    currentState: view.currentState,
    currentBeatDescriptors: view.currentBeatDescriptors,
    currentBeatType: view.currentBeatType,
    currentBeatCharacterEffects: view.currentBeatCharacterEffects,
    playbackBeat,
    isFinished: view.isFinished,
    // true once the first beat, BATTLE_START, has been applied
    hasBattleStarted: playbackBeat >= 0,
    advance,
    canAdvance,
    viewPreviousBeat,
    viewNextBeat,
    canViewPrevious: viewingBeat > 0,
    canViewNext: viewingBeat < playbackBeat,
    isPlaying,
    play,
    pause,
    autoplaySpeed,
    setAutoplaySpeed,
    // the beat the log shows, and the turn in effect at it (Phase 14)
    viewedBeat: viewingBeat,
    viewedTurn: view.viewedTurn,
  };
}
