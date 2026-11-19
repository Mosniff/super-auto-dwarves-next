import { describe, it, expect } from "vitest";
import {
  buildPlaceholderEnemyEncounter,
  DUMMY_ENEMY_ROSTER,
} from "./dummyEnemyRoster";

describe("dummyEnemyRoster", () => {
  it("E1: the placeholder enemy is a single Borin spawned from the borin template", () => {
    expect(
      DUMMY_ENEMY_ROSTER.map((enemyCharacter) => [
        enemyCharacter.id,
        (enemyCharacter as unknown as { characterTemplateId: string })
          .characterTemplateId,
        enemyCharacter.hp === enemyCharacter.maxHp,
      ]),
    ).toEqual([["enemy-1", "borin", true]]);
  });

  it("E2: the placeholder encounter is the dummy roster, as dwarves, with the given seed, in its own array", () => {
    const placeholderEnemyEncounter = buildPlaceholderEnemyEncounter(42);

    expect({
      placeholderEnemyEncounter,
      hasItsOwnArray:
        placeholderEnemyEncounter.enemyCharacters !== DUMMY_ENEMY_ROSTER,
    }).toEqual({
      placeholderEnemyEncounter: {
        enemyFactionId: "dwarf",
        enemyCharacters: DUMMY_ENEMY_ROSTER,
        battleSeed: 42,
      },
      hasItsOwnArray: true,
    });
  });
});
