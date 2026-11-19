import { storedBattleOutcome } from "@/lib/game/storedBattleOutcome";
import { buildGameStateFromLoadedRecord } from "./buildGameStateFromLoadedRecord";
import type { GameRepository } from "./gameRepository";

export type EndRunResult = "runEnded" | "noSave" | "runNotLost";

// Server-authority seam for the end-run intent (the game-over screen's
// "Return to menu"; Phase 13). The caller sends only a user id; the server
// re-resolves the stored battle and deletes the save only when that battle
// was lost (enemyWin). Anything else — a won or drawn battle, a camp, a
// stale or tampered intent — is refused without change ("runNotLost").
// "noSave" means there is nothing left to end (e.g. a double submit after
// the save was already deleted).
export async function endRunForUser(
  userId: string,
  gameRepository: GameRepository,
): Promise<EndRunResult> {
  const loadedGameRecord = await gameRepository.loadGameForUser(userId);

  if (loadedGameRecord === null) {
    return "noSave";
  }

  const currentGameState = buildGameStateFromLoadedRecord(loadedGameRecord);

  if (storedBattleOutcome(currentGameState) !== "enemyWin") {
    return "runNotLost";
  }

  await gameRepository.deleteGameForUser(userId);

  return "runEnded";
}
