import type { CampRoster } from "./campRoster";
import type { CharacterShopSlots } from "./characterShopSlots";
import type { EnemyEncounter } from "./enemyEncounter";

export type GamePhase = "campPhase" | "battlePhase";

// Mirrors the persisted Game run-state described in CLAUDE.md → "Persistence & save model".
// The saved roster is the 7-slot camp roster (gaps allowed), squeezed into a
// gapless battle Roster at battle start.
export interface GameState {
  playerRoster: CampRoster;
  gold: number;
  day: number;
  // how deep the run has gone; incremented with day (Phase 13)
  depth: number;
  phase: GamePhase;
  characterShopSlots: CharacterShopSlots;
  // the stored enemy for the battle in progress: present in battlePhase,
  // null in campPhase (Phase 13)
  enemyEncounter: EnemyEncounter | null;
}
