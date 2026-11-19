import { describe, it, expect } from "vitest";
import { createEmptyCampRoster } from "@/lib/game/campRoster";
import type { EnemyEncounter } from "@/lib/game/enemyEncounter";
import type { GamePhase, GameState } from "@/lib/game/types";
import { buildTestCharacter } from "@/test/characterFixtures";
import { buildFixtureCharacterShopSlots } from "@/test/characterShopFixtures";
import { buildTestEnemyEncounter } from "@/test/enemyEncounterFixtures";
import { storedBattleOutcome } from "./storedBattleOutcome";

function buildGameStateWithOneFighter(
  phase: GamePhase,
  playerFighter: { attack: number; hp: number },
  enemyEncounter: EnemyEncounter | null,
): GameState {
  const playerRoster = createEmptyCampRoster();
  playerRoster[0] = buildTestCharacter({
    id: "player-1",
    attack: playerFighter.attack,
    hp: playerFighter.hp,
    maxHp: playerFighter.hp,
  });

  return {
    playerRoster,
    gold: 10,
    day: 1,
    depth: 1,
    phase,
    characterShopSlots: buildFixtureCharacterShopSlots(),
    enemyEncounter,
  };
}

function buildOneEnemyEncounter(enemyFighter: {
  attack: number;
  hp: number;
}): EnemyEncounter {
  return buildTestEnemyEncounter({
    enemyCharacters: [
      buildTestCharacter({
        id: "enemy-1",
        attack: enemyFighter.attack,
        hp: enemyFighter.hp,
        maxHp: enemyFighter.hp,
      }),
    ],
  });
}

describe("storedBattleOutcome", () => {
  it("SB1: is null in campPhase", () => {
    expect(
      storedBattleOutcome(
        buildGameStateWithOneFighter("campPhase", { attack: 3, hp: 5 }, null),
      ),
    ).toBeNull();
  });

  it("SB2: re-resolves the stored battle: a loss, a win and a draw", () => {
    expect(
      [
        buildGameStateWithOneFighter(
          "battlePhase",
          { attack: 3, hp: 5 },
          buildOneEnemyEncounter({ attack: 4, hp: 7 }),
        ),
        buildGameStateWithOneFighter(
          "battlePhase",
          { attack: 3, hp: 5 },
          buildOneEnemyEncounter({ attack: 1, hp: 1 }),
        ),
        buildGameStateWithOneFighter(
          "battlePhase",
          { attack: 5, hp: 5 },
          buildOneEnemyEncounter({ attack: 5, hp: 5 }),
        ),
      ].map(storedBattleOutcome),
    ).toEqual(["enemyWin", "playerWin", "draw"]);
  });
});
