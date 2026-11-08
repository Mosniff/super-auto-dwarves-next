import { describe, it, expect } from "vitest";
import { advanceGame } from "./advanceGame";
import type { GamePhase, GameState } from "./types";
import type { OwnedCharacter } from "./ownedCharacter";
import type { CampRoster } from "./campRoster";
import { CAMP_STARTING_GOLD } from "./campState";

// Arbitrary fixture value — starting gold is not yet specified.
const FIXTURE_GOLD = 10;

function buildFixtureCampRoster(): CampRoster {
  const fixtureCharacter: OwnedCharacter = {
    id: "fixture-dwarf-1",
    name: "Fixture Dwarf",
    attack: 3,
    hp: 5,
    maxHp: 5,
    characterTemplateId: "fixture-dwarf",
    tier: 1,
    characterClassIds: ["warrior"],
  };

  return [fixtureCharacter, null, null, null, null, null, null];
}

function buildFixtureGameState(
  phase: GamePhase,
  day: number,
  overrides: Partial<GameState> = {},
): GameState {
  return {
    playerRoster: buildFixtureCampRoster(),
    gold: FIXTURE_GOLD,
    day,
    phase,
    purchasedShopListingIds: [],
    ...overrides,
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

  it("carries the roster, gold and purchased listings into battle, and the roster back to camp", () => {
    const campPhaseGameState = buildFixtureGameState("campPhase", 1, {
      purchasedShopListingIds: ["fixture-listing-1"],
    });
    const nextFromCampPhase = advanceGame(campPhaseGameState);

    expect(nextFromCampPhase.playerRoster).toEqual(
      campPhaseGameState.playerRoster,
    );
    expect(nextFromCampPhase.gold).toBe(campPhaseGameState.gold);
    expect(nextFromCampPhase.purchasedShopListingIds).toEqual(
      campPhaseGameState.purchasedShopListingIds,
    );

    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1);
    const nextFromBattlePhase = advanceGame(battlePhaseGameState);

    expect(nextFromBattlePhase.playerRoster).toEqual(
      battlePhaseGameState.playerRoster,
    );
  });

  it("sets gold to CAMP_STARTING_GOLD when returning to camp, discarding unspent gold", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1, {
      gold: 4,
    });

    const nextGameState = advanceGame(battlePhaseGameState);

    expect(nextGameState.gold).toBe(CAMP_STARTING_GOLD);
  });

  it("sets gold to CAMP_STARTING_GOLD when returning to camp with no gold left", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1, {
      gold: 0,
    });

    const nextGameState = advanceGame(battlePhaseGameState);

    expect(nextGameState.gold).toBe(CAMP_STARTING_GOLD);
  });

  it("clears purchased listings when returning to camp", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1, {
      purchasedShopListingIds: ["fixture-listing-1", "fixture-listing-2"],
    });

    const nextGameState = advanceGame(battlePhaseGameState);

    expect(nextGameState.purchasedShopListingIds).toEqual([]);
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
