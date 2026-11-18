import { describe, it, expect } from "vitest";
import { createEmptyCampRoster } from "@/lib/game/campRoster";
import type { GamePhase } from "@/lib/game/types";
import { buildFixtureCharacterShopSlots } from "@/test/characterShopFixtures";
import { buildTestCharacter } from "@/test/characterFixtures";
import { buildTestEnemyEncounter } from "@/test/enemyEncounterFixtures";
import { buildGameStateFromLoadedRecord } from "./buildGameStateFromLoadedRecord";
import type { LoadedGameRecord } from "./gameRepository";

function buildRecord(
  phase: GamePhase,
  persistedEnemyEncounter: unknown,
): LoadedGameRecord {
  return {
    gameId: "fixture-game-1",
    persistedPlayerRoster: createEmptyCampRoster(),
    gold: 10,
    day: 3,
    depth: 4,
    phase,
    persistedCharacterShopSlots: buildFixtureCharacterShopSlots(),
    persistedEnemyEncounter,
    revision: 5,
    createdAt: new Date("2026-10-13T00:00:00.000Z"),
  };
}

function doesBuildThrow(loadedGameRecord: LoadedGameRecord): boolean {
  try {
    buildGameStateFromLoadedRecord(loadedGameRecord);
    return false;
  } catch {
    return true;
  }
}

describe("buildGameStateFromLoadedRecord", () => {
  it("GS1: a campPhase record with no encounter builds the whole game state, depth included", () => {
    expect(buildGameStateFromLoadedRecord(buildRecord("campPhase", null))).toEqual(
      {
        playerRoster: createEmptyCampRoster(),
        gold: 10,
        day: 3,
        depth: 4,
        phase: "campPhase",
        characterShopSlots: buildFixtureCharacterShopSlots(),
        enemyEncounter: null,
      },
    );
  });

  it("GS2: a battlePhase record carries its parsed encounter", () => {
    const persistedEnemyEncounter = buildTestEnemyEncounter({
      enemyFactionId: "kobold",
      enemyCharacters: [buildTestCharacter({ id: "enemy-1" })],
      battleSeed: 99,
    });

    expect(
      buildGameStateFromLoadedRecord(
        buildRecord("battlePhase", persistedEnemyEncounter),
      ).enemyEncounter,
    ).toEqual({
      enemyFactionId: "kobold",
      enemyCharacters: [buildTestCharacter({ id: "enemy-1" })],
      battleSeed: 99,
    });
  });

  it("GS3: throws for a battlePhase record with no encounter, a campPhase record with one, and a malformed encounter", () => {
    expect(
      [
        buildRecord("battlePhase", null),
        buildRecord("campPhase", buildTestEnemyEncounter()),
        buildRecord("battlePhase", { enemyFactionId: "kobold" }),
      ].map(doesBuildThrow),
    ).toEqual([true, true, true]);
  });
});
