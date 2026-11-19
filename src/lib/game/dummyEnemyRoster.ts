import type { Character } from "./character";
import type { EnemyEncounter } from "./enemyEncounter";
import { CHARACTER_TEMPLATES } from "./characterTemplates";
import { spawnCharacterFromTemplate } from "./spawnCharacterFromTemplate";

// Placeholder enemy — a single Borin spawned from the borin template —
// until enemy generation (PvE logic, PvP snapshots) is specified;
// server-side only. Until then, the battle log will read "Borin attacks
// Borin" in a mirror match.
export const DUMMY_ENEMY_ROSTER: Character[] = [
  spawnCharacterFromTemplate(CHARACTER_TEMPLATES.borin, "enemy-1"),
];

// The placeholder encounter stored at camp -> battle until enemy
// generation lands (Phase 13, step 6 replaces it): the dummy roster, whose
// one Borin is a dwarf, with the battle seed the server rolled.
export function buildPlaceholderEnemyEncounter(
  battleSeed: number,
): EnemyEncounter {
  return {
    enemyFactionId: "dwarf",
    enemyCharacters: [...DUMMY_ENEMY_ROSTER],
    battleSeed,
  };
}
