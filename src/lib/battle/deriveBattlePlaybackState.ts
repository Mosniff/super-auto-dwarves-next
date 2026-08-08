import type {
  BattleEventDescriptor,
  BattleState,
  BeatType,
  ResolvedBattle,
} from "./types";
import { applyEvent } from "./applyEvent";
import { describeBattleEvent } from "./describeBattleEvent";
import { buildNameMap } from "./buildNameMap";

interface BattlePlaybackView {
  currentState: BattleState;
  currentBeatDescriptors: BattleEventDescriptor[];
  allBeatDescriptors: BattleEventDescriptor[][];
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

  const allBeatDescriptors: BattleEventDescriptor[][] = Array.from(
    { length: highestBeat + 1 },
    () => [],
  );
  for (const event of resolvedBattle.events) {
    allBeatDescriptors[event.beatIndex].push(
      describeBattleEvent(event, nameMap),
    );
  }

  const currentBeatDescriptors = allBeatDescriptors[viewingBeat] ?? [];

  const isFinished = playbackBeat >= highestBeat;

  const currentBeatType = resolvedBattle.events.find(
    (event) => event.beatIndex === playbackBeat,
  )?.beatType;

  return {
    currentState,
    currentBeatDescriptors,
    allBeatDescriptors,
    isFinished,
    currentBeatType,
  };
}
