import { describe, it, expect } from "vitest";
import { advanceGame } from "./advanceGame";
import type { GamePhase, GameState } from "./types";
import type { Character, Roster } from "@/lib/battle/types";

// Arbitrary fixture value — starting gold is not yet specified.
const FIXTURE_GOLD = 10;

function buildFixtureRoster(): Roster {
  const fixtureCharacter: Character = {
    id: "fixture-dwarf-1",
    name: "Fixture Dwarf",
    attack: 3,
    hp: 5,
    maxHp: 5,
  };

  return {
    activeCharacters: [fixtureCharacter],
    downedCharacters: [],
  };
}

function buildFixtureGameState(phase: GamePhase, day: number): GameState {
  return {
    playerRoster: buildFixtureRoster(),
    gold: FIXTURE_GOLD,
    day,
    phase,
  };
}

describe("advanceGame", () => {
  it("moves a campPhase game into battlePhase without changing the day", () => {
    const campPhaseGameState = buildFixtureGameState("campPhase", 1);

    const nextGameState = advanceGame(campPhaseGameState);

    expect(nextGameState.phase).toBe("battlePhase");
    expect(nextGameState.day).toBe(1);
  });

  it("moves a battlePhase game back to campPhase and increments the day", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1);

    const nextGameState = advanceGame(battlePhaseGameState);

    expect(nextGameState.phase).toBe("campPhase");
    expect(nextGameState.day).toBe(2);
  });

  it("carries the player roster and gold forward unchanged on both transitions", () => {
    const campPhaseGameState = buildFixtureGameState("campPhase", 1);
    const nextFromCampPhase = advanceGame(campPhaseGameState);

    expect(nextFromCampPhase.playerRoster).toEqual(
      campPhaseGameState.playerRoster,
    );
    expect(nextFromCampPhase.gold).toBe(campPhaseGameState.gold);

    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1);
    const nextFromBattlePhase = advanceGame(battlePhaseGameState);

    expect(nextFromBattlePhase.playerRoster).toEqual(
      battlePhaseGameState.playerRoster,
    );
    expect(nextFromBattlePhase.gold).toBe(battlePhaseGameState.gold);
  });

  it("does not mutate the input game state", () => {
    const campPhaseGameState = buildFixtureGameState("campPhase", 1);
    const campPhaseGameStateClone = structuredClone(campPhaseGameState);
    advanceGame(campPhaseGameState);
    expect(campPhaseGameState).toEqual(campPhaseGameStateClone);

    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1);
    const battlePhaseGameStateClone = structuredClone(battlePhaseGameState);
    advanceGame(battlePhaseGameState);
    expect(battlePhaseGameState).toEqual(battlePhaseGameStateClone);
  });

  it("a new game advanced through two full loops ends in campPhase on day 3", () => {
    const newGameState = buildFixtureGameState("campPhase", 1);

    const afterFirstAdvance = advanceGame(newGameState);
    const afterSecondAdvance = advanceGame(afterFirstAdvance);
    const afterThirdAdvance = advanceGame(afterSecondAdvance);
    const afterFourthAdvance = advanceGame(afterThirdAdvance);

    expect(afterFourthAdvance.phase).toBe("campPhase");
    expect(afterFourthAdvance.day).toBe(3);
  });
});
