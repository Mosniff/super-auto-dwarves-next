import type { EnemyEncounter } from "@/lib/game/enemyEncounter";
import { buildTestCharacter } from "./characterFixtures";

// Shared enemy-encounter builder (Phase 13). Same rule as
// characterFixtures.ts: the defaults are deliberately boring and must
// NEVER change; a test passes explicitly every value it depends on.
export function buildTestEnemyEncounter(
  overrides: Partial<EnemyEncounter> = {},
): EnemyEncounter {
  return {
    enemyFactionId: "dwarf",
    battleSeed: 1,
    ...overrides,
    enemyCharacters: [
      ...(overrides.enemyCharacters ?? [
        buildTestCharacter({ id: "fixture-enemy-1" }),
      ]),
    ],
  };
}
