import { CAMP_STARTING_GOLD } from "./campState";
import type { GameState } from "./types";

export function advanceGame(gameState: GameState): GameState {
  switch (gameState.phase) {
    case "campPhase":
      return { ...gameState, phase: "battlePhase" };
    case "battlePhase":
      // A future battle outcome will become an input to this transition
      // (CLAUDE.md → "Persistence & save model"). Every return to camp
      // resets gold to CAMP_STARTING_GOLD and clears purchased listings.
      return {
        ...gameState,
        phase: "campPhase",
        day: gameState.day + 1,
        gold: CAMP_STARTING_GOLD,
        purchasedShopListingIds: [],
      };
    default: {
      const exhaustiveCheck: never = gameState.phase;
      return exhaustiveCheck;
    }
  }
}
