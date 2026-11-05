import { describe, it, expect } from "vitest";
import { advanceGameForUser } from "./advanceGameForUser";
import type { GameRepository, LoadedGameRecord } from "./gameRepository";
import type { GamePhase, GameState } from "@/lib/game/types";
import type { CampRoster } from "@/lib/game/campRoster";

// Arbitrary fixture value — starting gold is not yet specified.
const FIXTURE_GOLD = 10;

const fixtureCampRoster: CampRoster = [
  { id: "dwarf-1", name: "Borin", attack: 3, hp: 5, maxHp: 5 },
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
  phase: GamePhase,
  day: number,
): LoadedGameRecord {
  return {
    gameId: "fixture-game-1",
    persistedPlayerRoster: fixtureCampRoster,
    gold: FIXTURE_GOLD,
    day,
    phase,
    purchasedShopListingIds: ["fixture-listing-1"],
    revision: 5,
    createdAt: new Date("2026-10-13T00:00:00.000Z"),
  };
}

describe("advanceGameForUser", () => {
  it("saves the game in battlePhase with the day unchanged when it was in campPhase", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord("campPhase", 1));

    await advanceGameForUser("fixture-user-1", "campPhase", gameRepository);

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

    await advanceGameForUser("fixture-user-1", "battlePhase", gameRepository);

    expect(recordedSaveGameStateCalls).toHaveLength(1);
    expect(recordedSaveGameStateCalls[0].nextGameState.phase).toBe(
      "campPhase",
    );
    expect(recordedSaveGameStateCalls[0].nextGameState.day).toBe(2);
  });

  it("carries the roster, gold and purchased listings through unchanged", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord("campPhase", 1));

    await advanceGameForUser("fixture-user-1", "campPhase", gameRepository);

    expect(recordedSaveGameStateCalls[0].nextGameState.playerRoster).toEqual(
      fixtureCampRoster,
    );
    expect(recordedSaveGameStateCalls[0].nextGameState.gold).toBe(
      FIXTURE_GOLD,
    );
    expect(
      recordedSaveGameStateCalls[0].nextGameState.purchasedShopListingIds,
    ).toEqual(["fixture-listing-1"]);
  });

  it("rejects when the user has no game", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(null);

    await expect(
      advanceGameForUser("fixture-user-1", "campPhase", gameRepository),
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
      purchasedShopListingIds: [],
      revision: 5,
      createdAt: new Date("2026-10-13T00:00:00.000Z"),
    };
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(malformedLoadedGameRecord);

    await expect(
      advanceGameForUser("fixture-user-1", "campPhase", gameRepository),
    ).rejects.toThrow();

    expect(recordedSaveGameStateCalls).toHaveLength(0);
  });

  it("treats a missing purchased-listings value as no purchases", async () => {
    const loadedGameRecordWithNullPurchasedListings: LoadedGameRecord = {
      gameId: "fixture-game-1",
      persistedPlayerRoster: fixtureCampRoster,
      gold: FIXTURE_GOLD,
      day: 1,
      phase: "campPhase",
      purchasedShopListingIds: null,
      revision: 5,
      createdAt: new Date("2026-10-13T00:00:00.000Z"),
    };
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(loadedGameRecordWithNullPurchasedListings);

    await advanceGameForUser("fixture-user-1", "campPhase", gameRepository);

    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.nextGameState.purchasedShopListingIds,
      ),
    ).toEqual([[]]);
  });

  it("saves conditionally on the loaded revision", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord("campPhase", 1));

    await advanceGameForUser("fixture-user-1", "campPhase", gameRepository);

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
      advanceGameForUser("fixture-user-1", "campPhase", gameRepository),
    ).resolves.toBeUndefined();
  });

  it("does nothing when the saved phase differs from the expected current phase", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(
        buildFixtureLoadedGameRecord("battlePhase", 1),
      );

    await expect(
      advanceGameForUser("fixture-user-1", "campPhase", gameRepository),
    ).resolves.toBeUndefined();

    expect(recordedSaveGameStateCalls).toHaveLength(0);
  });
});
