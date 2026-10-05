import type { Roster } from "@/lib/battle/types";

export type GamePhase = "campPhase" | "battlePhase";

// Mirrors the persisted Game run-state described in CLAUDE.md → "Persistence & save model".
export interface GameState {
  playerRoster: Roster;
  gold: number;
  day: number;
  phase: GamePhase;
}
