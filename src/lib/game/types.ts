import type { CampRoster } from "./campRoster";
import type { CharacterShopSlots } from "./characterShopSlots";

export type GamePhase = "campPhase" | "battlePhase";

// Mirrors the persisted Game run-state described in CLAUDE.md → "Persistence & save model".
// The saved roster is the 7-slot camp roster (gaps allowed), squeezed into a
// gapless battle Roster at battle start.
export interface GameState {
  playerRoster: CampRoster;
  gold: number;
  day: number;
  phase: GamePhase;
  // Superseded by characterShopSlots (Phase 9 part 3b); removed in Phase 9 part 4.
  purchasedShopListingIds: string[];
  characterShopSlots: CharacterShopSlots;
}
