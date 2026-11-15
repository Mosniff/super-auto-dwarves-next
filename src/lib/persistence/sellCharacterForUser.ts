import {
  sellCharacter,
  type SellCharacterRejectionReason,
} from "@/lib/game/sellCharacter";
import { buildGameStateFromLoadedRecord } from "./buildGameStateFromLoadedRecord";
import type { GameRepository } from "./gameRepository";

export interface SellCharacterIntent {
  slotIndex: number;
  expectedRevision: number;
}

export type SellCharacterForUserResult =
  | { outcome: "accepted" }
  | { outcome: "rejected"; rejectionReason: SellCharacterRejectionReason }
  | { outcome: "stale" };

// Server-authority seam (CLAUDE.md -> "Security / anti-cheat model"): the
// caller supplies only the user id and an intent, never state. Mirrors
// repositionCharacterForUser's check order: load; no game throws; an
// intent outside campPhase, or a stale expected revision, is treated as
// stale; the loaded record is built into trusted game state (a malformed
// roster throws); the pure rule runs and a rejection is returned without
// saving; an accepted rule result is saved conditionally on the loaded
// revision, and a lost race (false) is also reported as stale.
export async function sellCharacterForUser(
  userId: string,
  sellCharacterIntent: SellCharacterIntent,
  gameRepository: GameRepository,
): Promise<SellCharacterForUserResult> {
  const loadedGameRecord = await gameRepository.loadGameForUser(userId);

  if (loadedGameRecord === null) {
    // Deliberately no user id in this message — it is identifying data and
    // this message may reach logs.
    throw new Error("No game found for this user.");
  }

  if (loadedGameRecord.phase !== "campPhase") {
    return { outcome: "stale" };
  }

  if (loadedGameRecord.revision !== sellCharacterIntent.expectedRevision) {
    return { outcome: "stale" };
  }

  const currentGameState = buildGameStateFromLoadedRecord(loadedGameRecord);

  const sellResult = sellCharacter(
    {
      campRoster: currentGameState.playerRoster,
      gold: currentGameState.gold,
      characterShopSlots: currentGameState.characterShopSlots,
    },
    sellCharacterIntent.slotIndex,
  );

  if (sellResult.outcome === "rejected") {
    return { outcome: "rejected", rejectionReason: sellResult.rejectionReason };
  }

  const nextGameState = {
    ...currentGameState,
    playerRoster: sellResult.nextCampState.campRoster,
    gold: sellResult.nextCampState.gold,
    characterShopSlots: sellResult.nextCampState.characterShopSlots,
  };

  const saved = await gameRepository.saveGameState(
    loadedGameRecord.gameId,
    nextGameState,
    loadedGameRecord.revision,
  );

  if (!saved) {
    return { outcome: "stale" };
  }

  return { outcome: "accepted" };
}
