import { describe, it, expect } from "vitest";
import type { GameState } from "@/lib/game/types";
import type { CampRoster } from "@/lib/game/campRoster";
import type { Character } from "@/lib/battle/types";
import type { GameRepository, LoadedGameRecord } from "./gameRepository";
import {
  repositionCharacterForUser,
  type RepositionCharacterIntent,
} from "./repositionCharacterForUser";
import { buildFixtureCharacterShopSlots } from "@/test/characterShopFixtures";

const fixtureBorin: Character = {
  id: "dwarf-1",
  name: "Borin",
  attack: 3,
  hp: 5,
  maxHp: 5,
  characterTemplateId: "fixture-dwarf",
  tier: 1,
  characterClassIds: ["warrior"],
};

const fixtureCampRoster: CampRoster = [
  fixtureBorin,
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

const fixtureRepositionIntent: RepositionCharacterIntent = {
  fromSlotIndex: 0,
  toSlotIndex: 4,
  expectedRevision: 5,
};

describe("repositionCharacterForUser", () => {
  it("(a) saves the moved roster with gold and purchases unchanged, and reports accepted", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord());

    const result = await repositionCharacterForUser(
      "fixture-user-1",
      fixtureRepositionIntent,
      gameRepository,
    );

    const expectedCampRoster: CampRoster = [
      null,
      null,
      null,
      null,
      fixtureBorin,
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

    await repositionCharacterForUser(
      "fixture-user-1",
      fixtureRepositionIntent,
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

    const result = await repositionCharacterForUser(
      "fixture-user-1",
      { fromSlotIndex: 1, toSlotIndex: 2, expectedRevision: 5 },
      gameRepository,
    );

    expect(result).toEqual({
      outcome: "rejected",
      rejectionReason: "sourceSlotEmpty",
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

    const result = await repositionCharacterForUser(
      "fixture-user-1",
      { ...fixtureRepositionIntent, expectedRevision: 4 },
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

    const result = await repositionCharacterForUser(
      "fixture-user-1",
      fixtureRepositionIntent,
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

    const result = await repositionCharacterForUser(
      "fixture-user-1",
      fixtureRepositionIntent,
      gameRepository,
    );

    expect(result).toEqual({ outcome: "stale" });
  });

  it("(g) rejects when the user has no game", async () => {
    const { gameRepository } = buildFakeGameRepository(null);

    await expect(
      repositionCharacterForUser(
        "fixture-user-1",
        fixtureRepositionIntent,
        gameRepository,
      ),
    ).rejects.toThrow();
  });
});
