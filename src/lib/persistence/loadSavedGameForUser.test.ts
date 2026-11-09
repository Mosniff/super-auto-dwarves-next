import { describe, it, expect } from "vitest";
import { loadSavedGameForUser } from "./loadSavedGameForUser";
import type { GameRepository, LoadedGameRecord } from "./gameRepository";
import type { CampRoster } from "@/lib/game/campRoster";
import { buildFixtureCharacterShopSlots } from "@/test/characterShopFixtures";

const FIXTURE_GOLD = 10;

const fixtureCampRoster: CampRoster = [
  {
    id: "dwarf-1",
    name: "Borin",
    attack: 3,
    hp: 5,
    maxHp: 5,
    characterTemplateId: "fixture-dwarf",
    tier: 1,
    characterClassIds: ["warrior"],
  },
  null,
  null,
  null,
  null,
  null,
  null,
];

function buildFakeGameRepository(
  initialLoadedGameRecord: LoadedGameRecord | null,
) {
  const gameRepository: GameRepository = {
    loadGameForUser: async () => initialLoadedGameRecord,
    saveGameState: async () => true,
    createGame: async () => {},
    deleteGameForUser: async () => {},
  };

  return { gameRepository };
}

describe("loadSavedGameForUser", () => {
  it("(d) resolves to null when loadGameForUser returns null", async () => {
    const { gameRepository } = buildFakeGameRepository(null);

    const savedGame = await loadSavedGameForUser(
      "fixture-user-1",
      gameRepository,
    );

    expect(savedGame).toBeNull();
  });

  it("(e) resolves to a gameState matching the record's roster, gold, day and phase", async () => {
    const { gameRepository } = buildFakeGameRepository({
      gameId: "fixture-game-1",
      persistedPlayerRoster: fixtureCampRoster,
      gold: FIXTURE_GOLD,
      day: 3,
      phase: "campPhase",
      persistedCharacterShopSlots: buildFixtureCharacterShopSlots(),
      revision: 5,
      createdAt: new Date("2026-10-13T00:00:00.000Z"),
    });

    const savedGame = await loadSavedGameForUser(
      "fixture-user-1",
      gameRepository,
    );

    expect(savedGame?.gameState.playerRoster).toEqual(fixtureCampRoster);
    expect(savedGame?.gameState.gold).toBe(FIXTURE_GOLD);
    expect(savedGame?.gameState.day).toBe(3);
    expect(savedGame?.gameState.phase).toBe("campPhase");
  });

  it("(f) resolves with createdAt equal to the record's createdAt", async () => {
    const fixtureCreatedAt = new Date("2026-10-13T00:00:00.000Z");
    const { gameRepository } = buildFakeGameRepository({
      gameId: "fixture-game-1",
      persistedPlayerRoster: fixtureCampRoster,
      gold: FIXTURE_GOLD,
      day: 1,
      phase: "campPhase",
      persistedCharacterShopSlots: buildFixtureCharacterShopSlots(),
      revision: 5,
      createdAt: fixtureCreatedAt,
    });

    const savedGame = await loadSavedGameForUser(
      "fixture-user-1",
      gameRepository,
    );

    expect(savedGame?.createdAt).toEqual(fixtureCreatedAt);
  });

  it("(g) rejects when the record's persistedPlayerRoster is malformed", async () => {
    const { gameRepository } = buildFakeGameRepository({
      gameId: "fixture-game-1",
      persistedPlayerRoster: { activeCharacters: "not-an-array" },
      gold: FIXTURE_GOLD,
      day: 1,
      phase: "campPhase",
      persistedCharacterShopSlots: buildFixtureCharacterShopSlots(),
      revision: 5,
      createdAt: new Date("2026-10-13T00:00:00.000Z"),
    });

    await expect(
      loadSavedGameForUser("fixture-user-1", gameRepository),
    ).rejects.toThrow();
  });

  it("(i) resolves with the record's revision", async () => {
    const { gameRepository } = buildFakeGameRepository({
      gameId: "fixture-game-1",
      persistedPlayerRoster: fixtureCampRoster,
      gold: FIXTURE_GOLD,
      day: 1,
      phase: "campPhase",
      persistedCharacterShopSlots: buildFixtureCharacterShopSlots(),
      revision: 5,
      createdAt: new Date("2026-10-13T00:00:00.000Z"),
    });

    const savedGame = await loadSavedGameForUser(
      "fixture-user-1",
      gameRepository,
    );

    expect(savedGame?.revision).toBe(5);
  });

  it("L1: resolves with the record's shop slots", async () => {
    const { gameRepository } = buildFakeGameRepository({
      gameId: "fixture-game-1",
      persistedPlayerRoster: fixtureCampRoster,
      gold: FIXTURE_GOLD,
      day: 1,
      phase: "campPhase",
      persistedCharacterShopSlots: buildFixtureCharacterShopSlots(),
      revision: 5,
      createdAt: new Date("2026-10-13T00:00:00.000Z"),
    });

    const savedGame = await loadSavedGameForUser(
      "fixture-user-1",
      gameRepository,
    );

    expect(savedGame?.gameState.characterShopSlots).toEqual(buildFixtureCharacterShopSlots());
  });

  it("L2: rejects when the record's persistedCharacterShopSlots is malformed", async () => {
    const { gameRepository } = buildFakeGameRepository({
      gameId: "fixture-game-1",
      persistedPlayerRoster: fixtureCampRoster,
      gold: FIXTURE_GOLD,
      day: 1,
      phase: "campPhase",
      persistedCharacterShopSlots: "not-a-shop",
      revision: 5,
      createdAt: new Date("2026-10-13T00:00:00.000Z"),
    });

    await expect(
      loadSavedGameForUser("fixture-user-1", gameRepository),
    ).rejects.toThrow();
  });
});
