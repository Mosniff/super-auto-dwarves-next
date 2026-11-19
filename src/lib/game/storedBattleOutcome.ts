import type { BattleOutcome } from "@/lib/battle/types";
import { resolveCampBattle } from "./resolveCampBattle";
import type { GameState } from "./types";

// The outcome of the battle a game is in, re-resolved from what is stored:
// the camp roster against the stored enemy encounter (resolution is
// deterministic, so this is the same battle the player watched). Null
// outside battlePhase. Game over is decided only from this, on the server
// (Phase 13).
export function storedBattleOutcome(gameState: GameState): BattleOutcome | null {
  if (gameState.phase !== "battlePhase" || gameState.enemyEncounter === null) {
    return null;
  }

  const resolvedBattle = resolveCampBattle(
    gameState.playerRoster,
    gameState.enemyEncounter,
  );
  const finalEvent = resolvedBattle.events[resolvedBattle.events.length - 1];

  if (finalEvent?.type !== "BATTLE_END") {
    throw new Error("A resolved battle must end with BATTLE_END.");
  }

  return finalEvent.outcome;
}
