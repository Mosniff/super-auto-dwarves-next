import { createEmptyCampRoster } from "./campRoster";
import type { GameState } from "./types";

// The starting state for a new game: seven empty camp slots, no purchased
// listings, 10 gold, day 1, campPhase — decided 13 October 2026. This is
// deliberately a named function rather than inline literals, because it's
// the seam that will later grow into richer start-of-game logic. Must NOT
// be used to grant per-turn gold in advanceGame.ts — that's an unspecified
// game rule.
const STARTING_GOLD = 10;

export function createNewGameState(): GameState {
  return {
    playerRoster: createEmptyCampRoster(),
    gold: STARTING_GOLD,
    day: 1,
    phase: "campPhase",
    purchasedShopListingIds: [],
  };
}
