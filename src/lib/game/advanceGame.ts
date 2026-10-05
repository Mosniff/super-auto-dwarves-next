import type { GameState } from "./types";

export function advanceGame(gameState: GameState): GameState {
  switch (gameState.phase) {
    case "campPhase":
      return { ...gameState, phase: "battlePhase" };
    case "battlePhase":
      // A future battle outcome will become an input to this transition
      // (CLAUDE.md → "Persistence & save model").
      return { ...gameState, phase: "campPhase", day: gameState.day + 1 };
    default: {
      const exhaustiveCheck: never = gameState.phase;
      return exhaustiveCheck;
    }
  }
}
