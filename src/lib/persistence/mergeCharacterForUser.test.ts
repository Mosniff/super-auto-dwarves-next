import { describe, it, expect } from "vitest";
import type { GameState } from "@/lib/game/types";
import type { CampRoster } from "@/lib/game/campRoster";
import type { Character } from "@/lib/game/character";
import type { GameRepository, LoadedGameRecord } from "./gameRepository";
import {
  mergeCharacterForUser,
  type MergeCharacterIntent,
} from "./mergeCharacterForUser";
import { buildFixtureCharacterShopSlots } from "@/test/characterShopFixtures";
import { buildTestCharacter } from "@/test/characterFixtures";

// mechanical refactor: replaced with buildTestCharacter
const fixtureBorin: Character = buildTestCharacter({
  id: "dwarf-1",
  name: "Borin",
  attack: 3,
  hp: 5,
  maxHp: 5,
  characterTemplateId: "fixture-dwarf",
  tier: 1,
  characterClassIds: ["warrior"],
  experience: 0,
});

// mechanical refactor: replaced with buildTestCharacter
const fixtureThrain: Character = buildTestCharacter({
  id: "dwarf-2",
  name: "Thrain",
  attack: 3,
  hp: 5,
  maxHp: 5,
  characterTemplateId: "fixture-dwarf",
  tier: 1,
  characterClassIds: ["warrior"],
  experience: 1,
});

const fixtureCampRoster: CampRoster = [
  fixtureBorin,
  null,
  fixtureThrain,
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

function buildFixtureLoadedGameRecord(
  overrides: Partial<LoadedGameRecord> = {},
): LoadedGameRecord {
  return {
    gameId: "fixture-game-1",
    persistedPlayerRoster: fixtureCampRoster,
    gold: 10,
    day: 2,
    phase: "campPhase",
    persistedCharacterShopSlots: buildFixtureCharacterShopSlots(),
    revision: 5,
    createdAt: new Date("2026-10-13T00:00:00.000Z"),
    ...overrides,
  };
}

const fixtureMergeIntent: MergeCharacterIntent = {
  fromSlotIndex: 2,
  intoSlotIndex: 0,
  expectedRevision: 5,
};

describe("mergeCharacterForUser", () => {
  it("(a) saves the merged roster with gold and shop unchanged, and reports accepted", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord());

    const result = await mergeCharacterForUser(
      "fixture-user-1",
      fixtureMergeIntent,
      gameRepository,
    );

    const expectedCampRoster: CampRoster = [
      {
        ...fixtureBorin,
        experience: 2,
        attack: 5,
        hp: 7,
        maxHp: 7,
      },
      null,
      null,
      null,
      null,
      null,
      null,
    ];
    const expectedGameState: GameState = {
      playerRoster: expectedCampRoster,
      gold: 10,
      day: 2,
      phase: "campPhase",
      characterShopSlots: buildFixtureCharacterShopSlots(),
    };

    expect(result).toEqual({ outcome: "accepted" });
    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.nextGameState,
      ),
    ).toEqual([expectedGameState]);
  });

  it("(b) saves conditionally on the loaded revision", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord());

    await mergeCharacterForUser(
      "fixture-user-1",
      fixtureMergeIntent,
      gameRepository,
    );

    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.expectedRevision,
      ),
    ).toEqual([5]);
  });

  it("(c) returns the rule's rejection and saves nothing", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord());

    const result = await mergeCharacterForUser(
      "fixture-user-1",
      { fromSlotIndex: 2, intoSlotIndex: 4, expectedRevision: 5 },
      gameRepository,
    );

    expect(result).toEqual({
      outcome: "rejected",
      rejectionReason: "targetSlotEmpty",
    });
    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.nextGameState,
      ),
    ).toEqual([]);
  });

  it("(d) treats a stale expected revision as stale and saves nothing", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord());

    const result = await mergeCharacterForUser(
      "fixture-user-1",
      { ...fixtureMergeIntent, expectedRevision: 4 },
      gameRepository,
    );

    expect(result).toEqual({ outcome: "stale" });
    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.nextGameState,
      ),
    ).toEqual([]);
  });

  it("(e) treats an intent outside campPhase as stale and saves nothing", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(
        buildFixtureLoadedGameRecord({ phase: "battlePhase" }),
      );

    const result = await mergeCharacterForUser(
      "fixture-user-1",
      fixtureMergeIntent,
      gameRepository,
    );

    expect(result).toEqual({ outcome: "stale" });
    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.nextGameState,
      ),
    ).toEqual([]);
  });

  it("(f) reports stale when the conditional save finds the game changed", async () => {
    const { gameRepository } = buildFakeGameRepository(
      buildFixtureLoadedGameRecord(),
      { saveGameStateResult: false },
    );

    const result = await mergeCharacterForUser(
      "fixture-user-1",
      fixtureMergeIntent,
      gameRepository,
    );

    expect(result).toEqual({ outcome: "stale" });
  });

  it("(g) rejects when the user has no game", async () => {
    const { gameRepository } = buildFakeGameRepository(null);

    await expect(
      mergeCharacterForUser(
        "fixture-user-1",
        fixtureMergeIntent,
        gameRepository,
      ),
    ).rejects.toThrow();
  });

  it("(h) rejects when the stored roster is malformed, saving nothing", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(
        buildFixtureLoadedGameRecord({
          persistedPlayerRoster: { activeCharacters: "not-an-array" },
        }),
      );

    await expect(
      mergeCharacterForUser(
        "fixture-user-1",
        fixtureMergeIntent,
        gameRepository,
      ),
    ).rejects.toThrow();
    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.nextGameState,
      ),
    ).toEqual([]);
  });
});
