import { describe, it, expect } from "vitest";
import { advanceGame } from "./advanceGame";
import type { GamePhase, GameState } from "./types";
import type { Character } from "./character";
import type { CampRoster } from "./campRoster";
import { CAMP_STARTING_GOLD } from "./campState";
import {
  buildFixtureCharacterShopRollingSources,
  buildFixtureCharacterShopSlots,
  buildOfferingCharacterShopSlot,
  LOCKED_CHARACTER_SHOP_SLOT,
  SOLD_CHARACTER_SHOP_SLOT,
} from "@/test/characterShopFixtures";
import { buildTestCharacter } from "@/test/characterFixtures";
import { buildTestEnemyEncounter } from "@/test/enemyEncounterFixtures";
import { buildPlaceholderEnemyEncounter } from "./dummyEnemyRoster";

// Arbitrary fixture value — starting gold is not yet specified.
const FIXTURE_GOLD = 10;

function buildFixtureCampRoster(): CampRoster {
  // mechanical refactor: replaced with buildTestCharacter
  const fixtureCharacter: Character = buildTestCharacter({
    id: "fixture-dwarf-1",
    name: "Fixture Dwarf",
    attack: 3,
    hp: 5,
    maxHp: 5,
    characterTemplateId: "fixture-dwarf",
    tier: 1,
    characterClassIds: ["warrior"],
    experience: 0,
  });

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
    depth: day,
    phase,
    characterShopSlots: buildFixtureCharacterShopSlots(),
    enemyEncounter: null,
    ...overrides,
  };
}

describe("advanceGame", () => {
  it("moves a campPhase game into battlePhase without changing the day", () => {
    const campPhaseGameState = buildFixtureGameState("campPhase", 1);

    const nextGameState = advanceGame(
      campPhaseGameState,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

    expect(nextGameState.phase).toBe("battlePhase");
    expect(nextGameState.day).toBe(1);
  });

  it("moves a battlePhase game back to campPhase and increments the day", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1);

    const nextGameState = advanceGame(
      battlePhaseGameState,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

    expect(nextGameState.phase).toBe("campPhase");
    expect(nextGameState.day).toBe(2);
  });

  it("carries the roster and gold into battle, and the roster back to camp", () => {
    const campPhaseGameState = buildFixtureGameState("campPhase", 1);
    const nextFromCampPhase = advanceGame(
      campPhaseGameState,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

    expect(nextFromCampPhase.playerRoster).toEqual(
      campPhaseGameState.playerRoster,
    );
    expect(nextFromCampPhase.gold).toBe(campPhaseGameState.gold);

    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1);
    const nextFromBattlePhase = advanceGame(
      battlePhaseGameState,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

    expect(nextFromBattlePhase.playerRoster).toEqual(
      battlePhaseGameState.playerRoster,
    );
  });

  it("sets gold to CAMP_STARTING_GOLD when returning to camp, discarding unspent gold", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1, {
      gold: 4,
    });

    const nextGameState = advanceGame(
      battlePhaseGameState,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

    expect(nextGameState.gold).toBe(CAMP_STARTING_GOLD);
  });

  it("sets gold to CAMP_STARTING_GOLD when returning to camp with no gold left", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1, {
      gold: 0,
    });

    const nextGameState = advanceGame(
      battlePhaseGameState,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

    expect(nextGameState.gold).toBe(CAMP_STARTING_GOLD);
  });

  it("does not mutate the input game state", () => {
    const campPhaseGameState = buildFixtureGameState("campPhase", 1);
    const campPhaseGameStateClone = structuredClone(campPhaseGameState);
    advanceGame(
      campPhaseGameState,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );
    expect(campPhaseGameState).toEqual(campPhaseGameStateClone);

    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1);
    const battlePhaseGameStateClone = structuredClone(battlePhaseGameState);
    advanceGame(
      battlePhaseGameState,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );
    expect(battlePhaseGameState).toEqual(battlePhaseGameStateClone);
  });

  it("a new game advanced through two full loops ends in campPhase on day 3", () => {
    const newGameState = buildFixtureGameState("campPhase", 1);

    const afterFirstAdvance = advanceGame(
      newGameState,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );
    const afterSecondAdvance = advanceGame(
      afterFirstAdvance,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );
    const afterThirdAdvance = advanceGame(
      afterSecondAdvance,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );
    const afterFourthAdvance = advanceGame(
      afterThirdAdvance,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

    expect(afterFourthAdvance.phase).toBe("campPhase");
    expect(afterFourthAdvance.day).toBe(3);
  });

  it("A1: re-rolls the shop when returning to camp, keeping the open-slot count", () => {
    const campPhaseGameState = buildFixtureGameState("campPhase", 1);
    const { characterShopRollingSources, recordedOptionCounts } =
      buildFixtureCharacterShopRollingSources();

    const nextGameState = advanceGame(campPhaseGameState, characterShopRollingSources);

    expect(nextGameState.characterShopSlots).toEqual(buildFixtureCharacterShopSlots());
    expect(recordedOptionCounts).toEqual([]);
  });

  it("A2: re-rolls every open slot (sold or offering), keeping the open-slot count", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1, {
      characterShopSlots: [
        SOLD_CHARACTER_SHOP_SLOT,
        buildOfferingCharacterShopSlot("fixture-dwarf-one"),
        buildOfferingCharacterShopSlot("fixture-dwarf-two"),
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
      ],
    });
    const { characterShopRollingSources, recordedOptionCounts } =
      buildFixtureCharacterShopRollingSources([0, 1, 0]);

    const nextGameState = advanceGame(battlePhaseGameState, characterShopRollingSources);

    expect(nextGameState.characterShopSlots).toEqual([
      buildOfferingCharacterShopSlot("fixture-dwarf-one"),
      buildOfferingCharacterShopSlot("fixture-dwarf-two"),
      buildOfferingCharacterShopSlot("fixture-dwarf-one"),
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
    ]);
    expect(recordedOptionCounts).toEqual([2, 2, 2]);
  });

  it("A3: re-rolls all sold slots when every slot was open", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1, {
      characterShopSlots: [
        SOLD_CHARACTER_SHOP_SLOT,
        SOLD_CHARACTER_SHOP_SLOT,
        SOLD_CHARACTER_SHOP_SLOT,
        SOLD_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
      ],
    });
    const { characterShopRollingSources, recordedOptionCounts } =
      buildFixtureCharacterShopRollingSources([]);

    const nextGameState = advanceGame(battlePhaseGameState, characterShopRollingSources);

    expect(nextGameState.characterShopSlots).toEqual([
      buildOfferingCharacterShopSlot("fixture-dwarf-one"),
      buildOfferingCharacterShopSlot("fixture-dwarf-one"),
      buildOfferingCharacterShopSlot("fixture-dwarf-one"),
      buildOfferingCharacterShopSlot("fixture-dwarf-one"),
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
    ]);
    expect(recordedOptionCounts).toEqual([2, 2, 2, 2]);
  });

  const fixturePennyPincherAbility = {
    abilityId: "penny-pincher",
    trigger: "onCampStart",
    goldByLevel: [2, 3, 5, 7, 11],
  } as const;

  function findFixturePennyPincherAbility(character: Character) {
    return character.characterTemplateId === "fixture-pincher"
      ? fixturePennyPincherAbility
      : undefined;
  }

  function buildFixturePennyPincherCampRoster(): CampRoster {
    return [
      buildTestCharacter({
        id: "fixture-pincher-1",
        name: "Norbin",
        characterTemplateId: "fixture-pincher",
        experience: 3,
      }),
      null,
      null,
      null,
      null,
      null,
      null,
    ];
  }

  it("AG1: returning to camp fires onCampStart abilities: gold is the starting gold plus what they add", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1, {
      playerRoster: buildFixturePennyPincherCampRoster(),
    });

    const nextGameState = advanceGame(
      battlePhaseGameState,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
      findFixturePennyPincherAbility,
    );

    expect(nextGameState.gold).toBe(CAMP_STARTING_GOLD + 3);
  });

  it("AG2: going from camp to battle fires nothing", () => {
    const campPhaseGameState = buildFixtureGameState("campPhase", 1, {
      gold: 7,
      playerRoster: buildFixturePennyPincherCampRoster(),
    });

    const nextGameState = advanceGame(
      campPhaseGameState,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
      findFixturePennyPincherAbility,
    );

    expect(nextGameState.gold).toBe(7);
  });

  it("AG1: returning to camp clears the stored enemy encounter", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1, {
      enemyEncounter: buildTestEnemyEncounter(),
    });

    const nextGameState = advanceGame(
      battlePhaseGameState,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

    expect(nextGameState.enemyEncounter).toBeNull();
  });

  it("AG2: returning to camp increments the depth; entering battle leaves it unchanged", () => {
    const shopSources =
      buildFixtureCharacterShopRollingSources().characterShopRollingSources;

    expect({
      intoBattle: advanceGame(
        buildFixtureGameState("campPhase", 3, { depth: 3 }),
        shopSources,
      ).depth,
      backToCamp: advanceGame(
        buildFixtureGameState("battlePhase", 3, {
          depth: 3,
          enemyEncounter: buildTestEnemyEncounter(),
        }),
        shopSources,
      ).depth,
    }).toEqual({ intoBattle: 3, backToCamp: 4 });
  });

  it("AG3: entering battle stores the encounter created from the state leaving camp", () => {
    const campPhaseGameState = buildFixtureGameState("campPhase", 2, {
      depth: 2,
    });
    const createdEnemyEncounter = buildTestEnemyEncounter({
      enemyFactionId: "kobold",
      battleSeed: 7,
    });
    const receivedGameStates: GameState[] = [];

    const nextGameState = advanceGame(
      campPhaseGameState,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
      undefined,
      (enteringGameState) => {
        receivedGameStates.push(enteringGameState);
        return createdEnemyEncounter;
      },
    );

    expect({
      storedEnemyEncounter: nextGameState.enemyEncounter,
      receivedGameStates,
    }).toEqual({
      storedEnemyEncounter: createdEnemyEncounter,
      receivedGameStates: [campPhaseGameState],
    });
  });

  it("AG4: returning to camp never creates an encounter", () => {
    const receivedGameStates: GameState[] = [];

    advanceGame(
      buildFixtureGameState("battlePhase", 2, {
        enemyEncounter: buildTestEnemyEncounter(),
      }),
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
      undefined,
      (enteringGameState) => {
        receivedGameStates.push(enteringGameState);
        return buildTestEnemyEncounter();
      },
    );

    expect(receivedGameStates).toEqual([]);
  });

  it("AG5: with no encounter creator, entering battle stores the seed-0 placeholder (the fixture default)", () => {
    const nextGameState = advanceGame(
      buildFixtureGameState("campPhase", 1),
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

    expect(nextGameState.enemyEncounter).toEqual(
      buildPlaceholderEnemyEncounter(0),
    );
  });
});
