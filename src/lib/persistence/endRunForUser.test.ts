import { describe, it, expect } from "vitest";
import { createEmptyCampRoster } from "@/lib/game/campRoster";
import type { GamePhase } from "@/lib/game/types";
import { buildTestCharacter } from "@/test/characterFixtures";
import { buildFixtureCharacterShopSlots } from "@/test/characterShopFixtures";
import { buildTestEnemyEncounter } from "@/test/enemyEncounterFixtures";
import { endRunForUser } from "./endRunForUser";
import type { GameRepository, LoadedGameRecord } from "./gameRepository";

function buildFakeGameRepository(loadedGameRecord: LoadedGameRecord | null) {
  const deletedForUserIds: string[] = [];
  const savedGameIds: string[] = [];

  const gameRepository: GameRepository = {
    loadGameForUser: async () => loadedGameRecord,
    saveGameState: async (gameId) => {
      savedGameIds.push(gameId);
      return true;
    },
    createGame: async () => {},
    deleteGameForUser: async (userId) => {
      deletedForUserIds.push(userId);
    },
  };

  return { gameRepository, deletedForUserIds, savedGameIds };
}

// One player fighter against one enemy fighter (outcomes pinned by
// storedBattleOutcome's SB2): 3/5 vs 4/7 is lost, 3/5 vs 1/1 is won and
// 5/5 vs 5/5 is drawn.
function buildRecord(
  phase: GamePhase,
  playerFighter: { attack: number; hp: number },
  enemyFighter: { attack: number; hp: number } | null,
): LoadedGameRecord {
  const persistedPlayerRoster = createEmptyCampRoster();
  persistedPlayerRoster[0] = buildTestCharacter({
    id: "player-1",
    attack: playerFighter.attack,
    hp: playerFighter.hp,
    maxHp: playerFighter.hp,
  });

  return {
    gameId: "fixture-game-1",
    persistedPlayerRoster,
    gold: 10,
    day: 4,
    depth: 4,
    phase,
    persistedCharacterShopSlots: buildFixtureCharacterShopSlots(),
    persistedEnemyEncounter:
      enemyFighter === null
        ? null
        : buildTestEnemyEncounter({
            enemyCharacters: [
              buildTestCharacter({
                id: "enemy-1",
                attack: enemyFighter.attack,
                hp: enemyFighter.hp,
                maxHp: enemyFighter.hp,
              }),
            ],
          }),
    revision: 5,
    createdAt: new Date("2026-10-13T00:00:00.000Z"),
  };
}

const lostBattleRecord = buildRecord(
  "battlePhase",
  { attack: 3, hp: 5 },
  { attack: 4, hp: 7 },
);
const wonBattleRecord = buildRecord(
  "battlePhase",
  { attack: 3, hp: 5 },
  { attack: 1, hp: 1 },
);
const drawnBattleRecord = buildRecord(
  "battlePhase",
  { attack: 5, hp: 5 },
  { attack: 5, hp: 5 },
);
const campRecord = buildRecord("campPhase", { attack: 3, hp: 5 }, null);

describe("endRunForUser", () => {
  it("ER1: a lost battle ends the run: the user's save is deleted once and nothing is saved", async () => {
    const { gameRepository, deletedForUserIds, savedGameIds } =
      buildFakeGameRepository(lostBattleRecord);

    const endRunResult = await endRunForUser("fixture-user-1", gameRepository);

    expect({ endRunResult, deletedForUserIds, savedGameIds }).toEqual({
      endRunResult: "runEnded",
      deletedForUserIds: ["fixture-user-1"],
      savedGameIds: [],
    });
  });

  it("ER2: a won battle, a drawn battle and a camp are refused without any change", async () => {
    const outcomes = [];

    for (const loadedGameRecord of [
      wonBattleRecord,
      drawnBattleRecord,
      campRecord,
    ]) {
      const { gameRepository, deletedForUserIds, savedGameIds } =
        buildFakeGameRepository(loadedGameRecord);

      outcomes.push({
        endRunResult: await endRunForUser("fixture-user-1", gameRepository),
        deletedForUserIds,
        savedGameIds,
      });
    }

    expect(outcomes).toEqual([
      { endRunResult: "runNotLost", deletedForUserIds: [], savedGameIds: [] },
      { endRunResult: "runNotLost", deletedForUserIds: [], savedGameIds: [] },
      { endRunResult: "runNotLost", deletedForUserIds: [], savedGameIds: [] },
    ]);
  });

  it("ER3: with no save there is nothing to end", async () => {
    const { gameRepository, deletedForUserIds } = buildFakeGameRepository(null);

    const endRunResult = await endRunForUser("fixture-user-1", gameRepository);

    expect({ endRunResult, deletedForUserIds }).toEqual({
      endRunResult: "noSave",
      deletedForUserIds: [],
    });
  });

  it("ER4: rejects a malformed save without deleting it", async () => {
    const { gameRepository, deletedForUserIds } = buildFakeGameRepository({
      ...lostBattleRecord,
      persistedPlayerRoster: "not-a-roster",
    });

    const rejected = await endRunForUser("fixture-user-1", gameRepository).then(
      () => false,
      () => true,
    );

    expect({ rejected, deletedForUserIds }).toEqual({
      rejected: true,
      deletedForUserIds: [],
    });
  });
});
