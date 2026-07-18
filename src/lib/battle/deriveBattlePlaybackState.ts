import type { BattleState, BeatType, ResolvedBattle } from "./types";
import { applyEvent } from "./applyEvent";
import { formatBattleEvent } from "./formatBattleEvent";
import { buildNameMap } from "./buildNameMap";

interface BattlePlaybackView {
  currentState: BattleState;
  currentBeatLines: string[];
  allBeatLines: string[][];
  isFinished: boolean;
  currentBeatType: BeatType | undefined;
}

export function deriveBattlePlaybackState(
  resolvedBattle: ResolvedBattle,
  playbackBeat: number,
  viewingBeat: number,
): BattlePlaybackView {
  const nameMap = buildNameMap(resolvedBattle.initialState);

  const appliedEvents = resolvedBattle.events.filter(
    (event) => event.beatIndex <= playbackBeat,
  );

  const currentState = appliedEvents.reduce(
    (state, event) => applyEvent(state, event),
    resolvedBattle.initialState,
  );

  const highestBeat = Math.max(
    ...resolvedBattle.events.map((event) => event.beatIndex),
  );

  const allBeatLines: string[][] = Array.from(
    { length: highestBeat + 1 },
    () => [],
  );
  for (const event of resolvedBattle.events) {
    allBeatLines[event.beatIndex].push(formatBattleEvent(event, nameMap));
  }

  const currentBeatLines = allBeatLines[viewingBeat] ?? [];

  const isFinished = playbackBeat >= highestBeat;

  const currentBeatType = resolvedBattle.events.find(
    (event) => event.beatIndex === playbackBeat,
  )?.beatType;

  return {
    currentState,
    currentBeatLines,
    allBeatLines,
    isFinished,
    currentBeatType,
  };
}
