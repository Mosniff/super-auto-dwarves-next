import type { Character } from "@/lib/battle/types";

// Placeholder enemy — a single fixed enemy, chosen by the human to keep
// hand-testing quick — until enemy generation (PvE logic, PvP snapshots)
// is specified; server-side only; deliberately copied, not imported, from
// dummy-battle.ts, which the next block removes.
export const DUMMY_ENEMY_ROSTER: Character[] = [
  { id: "enemy-1", name: "Grukk", attack: 5, hp: 6, maxHp: 6 },
];
