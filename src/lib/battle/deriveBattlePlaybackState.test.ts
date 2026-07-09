import { describe, it, expect } from "vitest";
import { deriveBattlePlaybackState } from "./deriveBattlePlaybackState";
import { resolveBattle } from "./resolveBattle";
import { applyEvent } from "./applyEvent";
import type { BattleCharacter } from "./types";

describe("deriveBattlePlaybackState", () => {
  const playerCharacters: BattleCharacter[] = [
    { id: "p1", name: "Borin", attack: 5, hp: 10 },
  ];
  const enemyCharacters: BattleCharacter[] = [
    { id: "e1", name: "Grukk", attack: 2, hp: 3 },
  ];
  const resolvedBattle = resolveBattle(playerCharacters, enemyCharacters);

  it("at position -1, nothing is applied: state equals initialState, log is empty, not finished", () => {
    const playbackView = deriveBattlePlaybackState(resolvedBattle, -1);

    expect(playbackView.currentState).toEqual(resolvedBattle.initialState);
    expect(playbackView.logLines).toEqual([]);
    expect(playbackView.isFinished).toBe(false);
  });

  it("at position 0, only the first event is applied", () => {
    const playbackView = deriveBattlePlaybackState(resolvedBattle, 0);

    expect(playbackView.logLines.length).toBe(1);
    expect(playbackView.logLines[0]).toBe("Battle start!");
    expect(playbackView.isFinished).toBe(false);
  });

  it("at the final position, all events are applied and isFinished is true", () => {
    const finalPosition = resolvedBattle.events.length - 1;

    const playbackView = deriveBattlePlaybackState(
      resolvedBattle,
      finalPosition,
    );

    expect(playbackView.isFinished).toBe(true);
    expect(playbackView.logLines.length).toBe(resolvedBattle.events.length);
    expect(playbackView.logLines.at(-1)).toBe("Victory!");
  });

  it("at the final position, the derived state matches a full manual reduce", () => {
    const finalPosition = resolvedBattle.events.length - 1;

    const playbackView = deriveBattlePlaybackState(
      resolvedBattle,
      finalPosition,
    );

    const manuallyReducedState = resolvedBattle.events.reduce(
      (state, event) => applyEvent(state, event),
      resolvedBattle.initialState,
    );

    expect(playbackView.currentState).toEqual(manuallyReducedState);
  });
});
