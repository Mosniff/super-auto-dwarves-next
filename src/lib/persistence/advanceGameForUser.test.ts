import { describe, it, expect } from "vitest";
import { advanceGameForUser } from "./advanceGameForUser";
import type { GameRepository, LoadedGameRecord } from "./gameRepository";
import type { GamePhase, GameState } from "@/lib/game/types";
import type { CampRoster } from "@/lib/game/campRoster";
import {
  buildFixtureCharacterShopRollingSources,
  buildFixtureCharacterShopSlots,
  buildOfferingCharacterShopSlot,
  LOCKED_CHARACTER_SHOP_SLOT,
  SOLD_CHARACTER_SHOP_SLOT,
} from "@/test/characterShopFixtures";
import { buildTestCharacter } from "@/test/characterFixtures";
import { buildTestEnemyEncounter } from "@/test/enemyEncounterFixtures";

// Arbitrary fixture value — starting gold is not yet specified.
const FIXTURE_GOLD = 10;

// mechanical refactor: replaced with buildTestCharacter
const fixtureCampRoster: CampRoster = [
  buildTestCharacter({
    id: "dwarf-1",
    name: "Borin",
    attack: 3,
    hp: 5,
    maxHp: 5,
    characterTemplateId: "fixture-dwarf",
    tier: 1,
    characterClassIds: ["warrior"],
    experience: 0,
  }),
  null,
  null,
  null,
  null,
  null,
  null,
];

interface RecordedSaveGameStateCall {
  gameId: string;
  nextGameState: GameState;
  expectedRevision: number;
}

function buildFakeGameRepository(
  initialLoadedGameRecord: LoadedGameRecord | null,
  options?: { saveGameStateResult?: boolean },
) {
  const saveGameStateResult = options?.saveGameStateResult ?? true;
  const recordedSaveGameStateCalls: RecordedSaveGameStateCall[] = [];

  const gameRepository: GameRepository = {
    loadGameForUser: async () => initialLoadedGameRecord,
    saveGameState: async (gameId, nextGameState, expectedRevision) => {
      recordedSaveGameStateCalls.push({
        gameId,
        nextGameState,
        expectedRevision,
      });
      return saveGameStateResult;
    },
    createGame: async () => {},
    deleteGameForUser: async () => {},
  };

  return { gameRepository, recordedSaveGameStateCalls };
}

// A battle the fixture roster wins: its one 3/5 dwarf beats this 1/1
// enemy. A lost battle can't be advanced out of (Phase 13), so the
// battlePhase fixtures must be winnable.
const fixtureWinnableEnemyEncounter = buildTestEnemyEncounter({
  enemyCharacters: [
    buildTestCharacter({ id: "fixture-enemy-1", attack: 1, hp: 1, maxHp: 1 }),
  ],
});

function buildFixtureLoadedGameRecord(
  phase: GamePhase,
  day: number,
): LoadedGameRecord {
  return {
    gameId: "fixture-game-1",
    persistedPlayerRoster: fixtureCampRoster,
    gold: FIXTURE_GOLD,
    day,
    depth: day,
    phase,
    persistedCharacterShopSlots: buildFixtureCharacterShopSlots(),
    persistedEnemyEncounter:
      phase === "battlePhase" ? fixtureWinnableEnemyEncounter : null,
    revision: 5,
    createdAt: new Date("2026-10-13T00:00:00.000Z"),
  };
}

describe("advanceGameForUser", () => {
  it("saves the game in battlePhase with the day unchanged when it was in campPhase", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord("campPhase", 1));

    await advanceGameForUser("fixture-user-1", "campPhase", gameRepository, buildFixtureCharacterShopRollingSources().characterShopRollingSources);

    expect(recordedSaveGameStateCalls).toHaveLength(1);
    expect(recordedSaveGameStateCalls[0].gameId).toBe("fixture-game-1");
    expect(recordedSaveGameStateCalls[0].nextGameState.phase).toBe(
      "battlePhase",
    );
    expect(recordedSaveGameStateCalls[0].nextGameState.day).toBe(1);
  });

  it("saves the game in campPhase with the day incremented when it was in battlePhase", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(
        buildFixtureLoadedGameRecord("battlePhase", 1),
      );

    await advanceGameForUser("fixture-user-1", "battlePhase", gameRepository, buildFixtureCharacterShopRollingSources().characterShopRollingSources);

    expect(recordedSaveGameStateCalls).toHaveLength(1);
    expect(recordedSaveGameStateCalls[0].nextGameState.phase).toBe(
      "campPhase",
    );
    expect(recordedSaveGameStateCalls[0].nextGameState.day).toBe(2);
  });

  it("carries the roster and gold through unchanged", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord("campPhase", 1));

    await advanceGameForUser("fixture-user-1", "campPhase", gameRepository, buildFixtureCharacterShopRollingSources().characterShopRollingSources);

    expect(recordedSaveGameStateCalls[0].nextGameState.playerRoster).toEqual(
      fixtureCampRoster,
    );
    expect(recordedSaveGameStateCalls[0].nextGameState.gold).toBe(
      FIXTURE_GOLD,
    );
  });

  it("rejects when the user has no game", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(null);

    await expect(
      advanceGameForUser("fixture-user-1", "campPhase", gameRepository, buildFixtureCharacterShopRollingSources().characterShopRollingSources),
    ).rejects.toThrow();

    expect(recordedSaveGameStateCalls).toHaveLength(0);
  });

  it("rejects when the stored roster is malformed", async () => {
    const malformedLoadedGameRecord: LoadedGameRecord = {
      gameId: "fixture-game-1",
      persistedPlayerRoster: { activeCharacters: "not-an-array" },
      gold: FIXTURE_GOLD,
      day: 1,
      phase: "campPhase",
      persistedCharacterShopSlots: buildFixtureCharacterShopSlots(),
      depth: 1,
      persistedEnemyEncounter: null,
      revision: 5,
      createdAt: new Date("2026-10-13T00:00:00.000Z"),
    };
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(malformedLoadedGameRecord);

    await expect(
      advanceGameForUser("fixture-user-1", "campPhase", gameRepository, buildFixtureCharacterShopRollingSources().characterShopRollingSources),
    ).rejects.toThrow();

    expect(recordedSaveGameStateCalls).toHaveLength(0);
  });

  it("saves conditionally on the loaded revision", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord("campPhase", 1));

    await advanceGameForUser("fixture-user-1", "campPhase", gameRepository, buildFixtureCharacterShopRollingSources().characterShopRollingSources);

    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.expectedRevision,
      ),
    ).toEqual([5]);
  });

  it("resolves without error when the conditional save finds the game changed", async () => {
    const { gameRepository } = buildFakeGameRepository(
      buildFixtureLoadedGameRecord("campPhase", 1),
      { saveGameStateResult: false },
    );

    await expect(
      advanceGameForUser("fixture-user-1", "campPhase", gameRepository, buildFixtureCharacterShopRollingSources().characterShopRollingSources),
    ).resolves.toBeUndefined();
  });

  it("does nothing when the saved phase differs from the expected current phase", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(
        buildFixtureLoadedGameRecord("battlePhase", 1),
      );

    await expect(
      advanceGameForUser("fixture-user-1", "campPhase", gameRepository, buildFixtureCharacterShopRollingSources().characterShopRollingSources),
    ).resolves.toBeUndefined();

    expect(recordedSaveGameStateCalls).toHaveLength(0);
  });

  it("H1: re-rolls the shop, keeping the open-slot count, when returning to camp", async () => {
    const battlePhaseLoadedGameRecord: LoadedGameRecord = {
      gameId: "fixture-game-1",
      persistedPlayerRoster: fixtureCampRoster,
      gold: FIXTURE_GOLD,
      day: 1,
      phase: "battlePhase",
      persistedCharacterShopSlots: [
        SOLD_CHARACTER_SHOP_SLOT,
        buildOfferingCharacterShopSlot("fixture-dwarf-one"),
        buildOfferingCharacterShopSlot("fixture-dwarf-two"),
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
      ],
      depth: 1,
      persistedEnemyEncounter: fixtureWinnableEnemyEncounter,
      revision: 5,
      createdAt: new Date("2026-10-13T00:00:00.000Z"),
    };
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(battlePhaseLoadedGameRecord);
    const { characterShopRollingSources } = buildFixtureCharacterShopRollingSources([1, 1, 1]);

    await advanceGameForUser(
      "fixture-user-1",
      "battlePhase",
      gameRepository,
      characterShopRollingSources,
    );

    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.nextGameState.characterShopSlots,
      ),
    ).toEqual([
      [
        buildOfferingCharacterShopSlot("fixture-dwarf-two"),
        buildOfferingCharacterShopSlot("fixture-dwarf-two"),
        buildOfferingCharacterShopSlot("fixture-dwarf-two"),
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
      ],
    ]);
  });

  it("H2: rejects when the stored shop is malformed, saving nothing", async () => {
    const malformedShopLoadedGameRecord: LoadedGameRecord = {
      gameId: "fixture-game-1",
      persistedPlayerRoster: fixtureCampRoster,
      gold: FIXTURE_GOLD,
      day: 1,
      phase: "campPhase",
      persistedCharacterShopSlots: "not-a-shop",
      depth: 1,
      persistedEnemyEncounter: null,
      revision: 5,
      createdAt: new Date("2026-10-13T00:00:00.000Z"),
    };
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(malformedShopLoadedGameRecord);

    await expect(
      advanceGameForUser(
        "fixture-user-1",
        "campPhase",
        gameRepository,
        buildFixtureCharacterShopRollingSources().characterShopRollingSources,
      ),
    ).rejects.toThrow();

    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.nextGameState,
      ),
    ).toEqual([]);
  });

  it("AF1: entering battle saves the encounter from the given creator", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord("campPhase", 1));
    const createdEnemyEncounter = buildTestEnemyEncounter({
      enemyFactionId: "kobold",
      battleSeed: 99,
    });

    await advanceGameForUser(
      "fixture-user-1",
      "campPhase",
      gameRepository,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
      () => createdEnemyEncounter,
    );

    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.nextGameState.enemyEncounter,
      ),
    ).toEqual([createdEnemyEncounter]);
  });

  it("AF2: an ordinary advance out of a lost battle is ignored, saving nothing", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository({
        ...buildFixtureLoadedGameRecord("battlePhase", 1),
        // the fixture dwarf (3/5) loses to this 4/7 enemy
        persistedEnemyEncounter: buildTestEnemyEncounter({
          enemyCharacters: [
            buildTestCharacter({
              id: "fixture-enemy-1",
              attack: 4,
              hp: 7,
              maxHp: 7,
            }),
          ],
        }),
      });

    await advanceGameForUser(
      "fixture-user-1",
      "battlePhase",
      gameRepository,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

    expect(recordedSaveGameStateCalls).toEqual([]);
  });

  it("AF3: a drawn battle survives: advancing returns to camp", async () => {
    const drawnPlayerRoster: CampRoster = [
      buildTestCharacter({ id: "fixture-dwarf-1", attack: 5, hp: 5, maxHp: 5 }),
      null,
      null,
      null,
      null,
      null,
      null,
    ];
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository({
        ...buildFixtureLoadedGameRecord("battlePhase", 1),
        persistedPlayerRoster: drawnPlayerRoster,
        persistedEnemyEncounter: buildTestEnemyEncounter({
          enemyCharacters: [
            buildTestCharacter({
              id: "fixture-enemy-1",
              attack: 5,
              hp: 5,
              maxHp: 5,
            }),
          ],
        }),
      });

    await advanceGameForUser(
      "fixture-user-1",
      "battlePhase",
      gameRepository,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.nextGameState.phase,
      ),
    ).toEqual(["campPhase"]);
  });
});
