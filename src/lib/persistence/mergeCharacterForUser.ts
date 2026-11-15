import { mergeRosterCharacters } from "@/lib/game/mergeRosterCharacters";
import type { MergeRosterCharactersRejectionReason } from "@/lib/game/mergeRosterCharacters";
import { buildGameStateFromLoadedRecord } from "./buildGameStateFromLoadedRecord";
import type { GameRepository } from "./gameRepository";

export interface MergeCharacterIntent {
  fromSlotIndex: number;
  intoSlotIndex: number;
  expectedRevision: number;
}

export type MergeCharacterForUserResult =
  | { outcome: "accepted" }
  | {
      outcome: "rejected";
      rejectionReason: MergeRosterCharactersRejectionReason;
    }
  | { outcome: "stale" };

// Server-authority seam (CLAUDE.md -> "Security / anti-cheat model"): the
// caller supplies only the user id and an intent, never state. Mirrors
// repositionCharacterForUser's check order: load; no game throws; an
// intent outside campPhase, or a stale expected revision, is treated as
// stale; the loaded record is built into trusted game state (a malformed
// roster throws); the pure rule runs and a rejection is returned without
// saving; an accepted rule result is saved conditionally on the loaded
// revision, and a lost race (false) is also reported as stale.
export async function mergeCharacterForUser(
  userId: string,
  mergeCharacterIntent: MergeCharacterIntent,
  gameRepository: GameRepository,
): Promise<MergeCharacterForUserResult> {
  const loadedGameRecord = await gameRepository.loadGameForUser(userId);

  if (loadedGameRecord === null) {
    // Deliberately no user id in this message — it is identifying data and
    // this message may reach logs.
    throw new Error("No game found for this user.");
  }

  if (loadedGameRecord.phase !== "campPhase") {
    return { outcome: "stale" };
  }

  if (loadedGameRecord.revision !== mergeCharacterIntent.expectedRevision) {
    return { outcome: "stale" };
  }

  const currentGameState = buildGameStateFromLoadedRecord(loadedGameRecord);

  const mergeResult = mergeRosterCharacters(
    currentGameState.playerRoster,
    mergeCharacterIntent.fromSlotIndex,
    mergeCharacterIntent.intoSlotIndex,
  );

  if (mergeResult.outcome === "rejected") {
    return {
      outcome: "rejected",
      rejectionReason: mergeResult.rejectionReason,
    };
  }

  const nextGameState = {
    ...currentGameState,
    playerRoster: mergeResult.nextCampRoster,
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
