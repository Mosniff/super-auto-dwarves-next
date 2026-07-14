import { describe, it, expect } from "vitest";
import { deriveBattlePlaybackState } from "./deriveBattlePlaybackState";
import { resolveBattle } from "./resolveBattle";
import { applyEvent } from "./applyEvent";
import type { BattleCharacter } from "./types";

describe("deriveBattlePlaybackState", () => {
  const playerCharacters: BattleCharacter[] = [
    { id: "p1", name: "Borin", attack: 2, hp: 3 },
    { id: "p2", name: "Thrudi", attack: 4, hp: 5 },
  ];
  const enemyCharacters: BattleCharacter[] = [
    { id: "e1", name: "Grukk", attack: 2, hp: 6 },
  ];
  const resolvedBattle = resolveBattle(playerCharacters, enemyCharacters);

  const highestBeat = Math.max(
    ...resolvedBattle.events.map((event) => event.beat),
  );

  it("at playbackBeat -1 / viewingBeat -1: nothing is applied, log is empty, not finished", () => {
    const playbackView = deriveBattlePlaybackState(resolvedBattle, -1, -1);

    expect(playbackView.currentState).toEqual(resolvedBattle.initialState);
    expect(playbackView.currentBeatLines).toEqual([]);
    expect(playbackView.isFinished).toBe(false);
  });

  it("at playbackBeat 0 / viewingBeat 0: only BATTLE_START is applied", () => {
    const playbackView = deriveBattlePlaybackState(resolvedBattle, 0, 0);

    expect(playbackView.currentBeatLines).toEqual(["Battle start!"]);
    expect(playbackView.isFinished).toBe(false);
  });

  it("at the clash beat, currentBeatLines groups both ATTACKs and both DAMAGEs together", () => {
    const firstAttackEvent = resolvedBattle.events.find(
      (event) => event.type === "ATTACK",
    );
    const clashBeat = firstAttackEvent!.beat;

    const playbackView = deriveBattlePlaybackState(
      resolvedBattle,
      clashBeat,
      clashBeat,
    );

    expect(playbackView.currentBeatLines.length).toBe(4);
  });

  it("at the final beat, isFinished is true and the derived state matches a full manual reduce", () => {
    const playbackView = deriveBattlePlaybackState(
      resolvedBattle,
      highestBeat,
      highestBeat,
    );

    const manuallyReducedState = resolvedBattle.events.reduce(
      (state, event) => applyEvent(state, event),
      resolvedBattle.initialState,
    );

    expect(playbackView.isFinished).toBe(true);
    expect(playbackView.currentState).toEqual(manuallyReducedState);
  });

  it("viewing an earlier beat does not rewind the battle state", () => {
    const playbackView = deriveBattlePlaybackState(
      resolvedBattle,
      highestBeat,
      0,
    );

    const manuallyReducedState = resolvedBattle.events.reduce(
      (state, event) => applyEvent(state, event),
      resolvedBattle.initialState,
    );

    expect(playbackView.currentState).toEqual(manuallyReducedState);
    expect(playbackView.currentBeatLines).toEqual(["Battle start!"]);
  });
});
