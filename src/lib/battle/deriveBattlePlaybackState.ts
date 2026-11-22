import type { Character } from "@/lib/game/character";
import type {
  BattleEventDescriptor,
  BattleState,
  BeatType,
  ResolvedBattle,
} from "./types";
import { applyEvent } from "./applyEvent";
import { describeBattleEvent } from "./describeBattleEvent";
import { buildCharacterLabelMap } from "./buildCharacterLabelMap";
import {
  beatCharacterEffects,
  type BeatCharacterEffect,
} from "./beatCharacterEffects";

interface BattlePlaybackView {
  currentState: BattleState;
  currentBeatDescriptors: BattleEventDescriptor[];
  allBeatDescriptors: BattleEventDescriptor[][];
  isFinished: boolean;
  currentBeatType: BeatType | undefined;
  // For the playback beat (what's animating now), not the viewing beat
  // (the log being read).
  currentBeatCharacterEffects: Record<string, BeatCharacterEffect>;
  // The turn in effect at the viewing beat (0 before turn 1), for the info
  // scroll's header (Phase 14). Taken from the viewing beat, unlike
  // currentState, which follows the playback beat.
  viewedTurn: number;
}

export function deriveBattlePlaybackState(
  resolvedBattle: ResolvedBattle,
  playbackBeat: number,
  viewingBeat: number,
  // the client's translated names for the log (Phase 13); see buildCharacterLabelMap
  displayCharacterName?: (character: Character) => string,
): BattlePlaybackView {
  const characterLabelMap = buildCharacterLabelMap(
    resolvedBattle.initialState,
    displayCharacterName,
  );

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
      describeBattleEvent(event, characterLabelMap),
    );
  }

  const currentBeatDescriptors = allBeatDescriptors[viewingBeat] ?? [];

  const viewedTurn = allBeatDescriptors
    .slice(0, viewingBeat + 1)
    .flat()
    .reduce(
      (turnSoFar, descriptor) =>
        descriptor.kind === "turnStart" ? descriptor.turn : turnSoFar,
      0,
    );

  const isFinished = playbackBeat >= highestBeat;

  const currentBeatType = resolvedBattle.events.find(
    (event) => event.beatIndex === playbackBeat,
  )?.beatType;

  const currentBeatCharacterEffects = beatCharacterEffects(
    resolvedBattle.events.filter((event) => event.beatIndex === playbackBeat),
  );

  return {
    currentState,
    currentBeatDescriptors,
    allBeatDescriptors,
    isFinished,
    currentBeatType,
    currentBeatCharacterEffects,
    viewedTurn,
  };
}
