import type { Character } from "@/lib/battle/types";
import { CHARACTER_TEMPLATES } from "./characterTemplates";
import { spawnCharacterFromTemplate } from "./spawnCharacterFromTemplate";

// Placeholder enemy — a single Borin spawned from the borin template —
// until enemy generation (PvE logic, PvP snapshots) is specified;
// server-side only. Until then, the battle log will read "Borin attacks
// Borin" in a mirror match.
export const DUMMY_ENEMY_ROSTER: Character[] = [
  spawnCharacterFromTemplate(CHARACTER_TEMPLATES.borin, "enemy-1"),
];
