import { describe, it, expect } from "vitest";
import { createEmptyCampRoster } from "./campRoster";
import type { GameState } from "./types";
import { buildFixtureCharacterShopSlots } from "@/test/characterShopFixtures";
import { generateEnemyEncounter } from "./generateEnemyEncounter";

function buildCampGameState(day: number, depth: number): GameState {
  return {
    playerRoster: createEmptyCampRoster(),
    gold: 10,
    day,
    depth,
    phase: "campPhase",
    characterShopSlots: buildFixtureCharacterShopSlots(),
    enemyEncounter: null,
  };
}

const KOBOLD_RUNT = {
  characterTemplateId: "kobold-runt",
  name: "Kobold Runt",
  tier: 1,
  characterFactionId: "kobold",
  characterClassIds: ["warrior"],
  attack: 1,
  hp: 3,
  maxHp: 3,
  armour: 0,
  experience: 0,
};

const KOBOLD_THIEF = {
  characterTemplateId: "kobold-thief",
  name: "Kobold Thief",
  tier: 1,
  characterFactionId: "kobold",
  characterClassIds: ["warrior"],
  attack: 2,
  hp: 3,
  maxHp: 3,
  armour: 0,
  experience: 0,
};

describe("generateEnemyEncounter", () => {
  it("GN1: day 2 at depth 2 is 4 points of kobolds, ordered by position, with the seed it is given", () => {
    // [runt, thief] -> thief (2 left); [runt, thief] -> runt (1 left);
    // [runt] -> runt (0 left)
    const scriptedIndexes = [1, 0, 0];
    let nextScriptIndex = 0;

    const enemyEncounter = generateEnemyEncounter(
      buildCampGameState(2, 2),
      () => {
        const scriptedIndex = scriptedIndexes[nextScriptIndex];
        nextScriptIndex += 1;
        return scriptedIndex;
      },
      424242,
    );

    expect(enemyEncounter).toEqual({
      enemyFactionId: "kobold",
      enemyCharacters: [
        { id: "enemy-1", ...KOBOLD_RUNT },
        { id: "enemy-2", ...KOBOLD_RUNT },
        { id: "enemy-3", ...KOBOLD_THIEF },
      ],
      battleSeed: 424242,
    });
  });

  it("GN2: the points are day × depth: day 3 at depth 2 buys six runts with the first option each time", () => {
    const enemyEncounter = generateEnemyEncounter(
      buildCampGameState(3, 2),
      () => 0,
      1,
    );

    expect(
      enemyEncounter.enemyCharacters.map(
        (enemyCharacter) => enemyCharacter.characterTemplateId,
      ),
    ).toEqual([
      "kobold-runt",
      "kobold-runt",
      "kobold-runt",
      "kobold-runt",
      "kobold-runt",
      "kobold-runt",
    ]);
  });
});
