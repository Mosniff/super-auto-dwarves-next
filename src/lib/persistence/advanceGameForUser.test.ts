import { describe, it, expect } from "vitest";
import { advanceGameForUser } from "./advanceGameForUser";
import type { GameRepository, LoadedGameRecord } from "./gameRepository";
import type { GamePhase, GameState } from "@/lib/game/types";
import type { Roster } from "@/lib/battle/types";

// Arbitrary fixture value — starting gold is not yet specified.
const FIXTURE_GOLD = 10;

const fixtureRoster: Roster = {
  activeCharacters: [
    { id: "dwarf-1", name: "Borin", attack: 3, hp: 5, maxHp: 5 },
  ],
  downedCharacters: [],
};

interface RecordedSaveGameStateCall {
  gameId: string;
  nextGameState: GameState;
}

function buildFakeGameRepository(
  initialLoadedGameRecord: LoadedGameRecord | null,
) {
  const recordedSaveGameStateCalls: RecordedSaveGameStateCall[] = [];

  const gameRepository: GameRepository = {
    loadGameForUser: async () => initialLoadedGameRecord,
    saveGameState: async (gameId, nextGameState) => {
      recordedSaveGameStateCalls.push({ gameId, nextGameState });
    },
  };

  return { gameRepository, recordedSaveGameStateCalls };
}

function buildFixtureLoadedGameRecord(
  phase: GamePhase,
  day: number,
): LoadedGameRecord {
  return {
    gameId: "fixture-game-1",
    persistedPlayerRoster: fixtureRoster,
    gold: FIXTURE_GOLD,
    day,
    phase,
  };
}

describe("advanceGameForUser", () => {
  it("saves the game in battlePhase with the day unchanged when it was in campPhase", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord("campPhase", 1));

    await advanceGameForUser("fixture-user-1", gameRepository);

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

    await advanceGameForUser("fixture-user-1", gameRepository);

    expect(recordedSaveGameStateCalls).toHaveLength(1);
    expect(recordedSaveGameStateCalls[0].nextGameState.phase).toBe(
      "campPhase",
    );
    expect(recordedSaveGameStateCalls[0].nextGameState.day).toBe(2);
  });

  it("carries the roster and gold through unchanged", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord("campPhase", 1));

    await advanceGameForUser("fixture-user-1", gameRepository);

    expect(recordedSaveGameStateCalls[0].nextGameState.playerRoster).toEqual(
      fixtureRoster,
    );
    expect(recordedSaveGameStateCalls[0].nextGameState.gold).toBe(
      FIXTURE_GOLD,
    );
  });

  it("rejects when the user has no game", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(null);

    await expect(
      advanceGameForUser("fixture-user-1", gameRepository),
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
    };
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(malformedLoadedGameRecord);

    await expect(
      advanceGameForUser("fixture-user-1", gameRepository),
    ).rejects.toThrow();

    expect(recordedSaveGameStateCalls).toHaveLength(0);
  });
});
