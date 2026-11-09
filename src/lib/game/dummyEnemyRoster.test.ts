import { describe, it, expect } from "vitest";
import { DUMMY_ENEMY_ROSTER } from "./dummyEnemyRoster";

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
});
