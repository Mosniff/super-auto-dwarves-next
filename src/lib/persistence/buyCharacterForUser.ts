import {
  buyCharacterFromShopSlot,
  type BuyCharacterFromShopSlotRejectionReason,
} from "@/lib/game/buyCharacterFromShopSlot";
import type { CharacterTemplate } from "@/lib/game/characterTemplates";
import { buildGameStateFromLoadedRecord } from "./buildGameStateFromLoadedRecord";
import type { GameRepository } from "./gameRepository";

export interface BuyCharacterIntent {
  shopSlotIndex: number;
  targetRosterSlotIndex: number;
  expectedRevision: number;
}

export interface BuyCharacterDependencies {
  gameRepository: GameRepository;
  characterTemplates: readonly CharacterTemplate[];
  generateCharacterId: () => string;
}

export type BuyCharacterForUserResult =
  | { outcome: "accepted" }
  | {
      outcome: "rejected";
      rejectionReason: BuyCharacterFromShopSlotRejectionReason;
    }
  | { outcome: "stale" };

// Server-authority seam (CLAUDE.md -> "Security / anti-cheat model"): the
// caller supplies only the user id and an intent, never state. Templates
// and prices come from the server (buyCharacterDependencies), never the
// client.
//
// Check order: load; no game throws; an intent outside campPhase, or a
// stale expected revision, is treated as stale; the loaded record is built
// into trusted game state (a malformed roster or shop throws); the pure
// rule runs and a rejection is returned without saving; an accepted rule
// result is saved conditionally on the loaded revision, and a lost race
// (false) is also reported as stale.
export async function buyCharacterForUser(
  userId: string,
  buyCharacterIntent: BuyCharacterIntent,
  buyCharacterDependencies: BuyCharacterDependencies,
): Promise<BuyCharacterForUserResult> {
  const { gameRepository, characterTemplates, generateCharacterId } =
    buyCharacterDependencies;

  const loadedGameRecord = await gameRepository.loadGameForUser(userId);

  if (loadedGameRecord === null) {
    // Deliberately no user id in this message — it is identifying data and
    // this message may reach logs.
    throw new Error("No game found for this user.");
  }

  if (loadedGameRecord.phase !== "campPhase") {
    return { outcome: "stale" };
  }

  if (loadedGameRecord.revision !== buyCharacterIntent.expectedRevision) {
    return { outcome: "stale" };
  }

  const currentGameState = buildGameStateFromLoadedRecord(loadedGameRecord);

  const buyResult = buyCharacterFromShopSlot(
    {
      campRoster: currentGameState.playerRoster,
      gold: currentGameState.gold,
      characterShopSlots: currentGameState.characterShopSlots,
    },
    characterTemplates,
    buyCharacterIntent.shopSlotIndex,
    buyCharacterIntent.targetRosterSlotIndex,
    generateCharacterId(),
  );

  if (buyResult.outcome === "rejected") {
    return { outcome: "rejected", rejectionReason: buyResult.rejectionReason };
  }

  const nextGameState = {
    ...currentGameState,
    playerRoster: buyResult.nextCampState.campRoster,
    gold: buyResult.nextCampState.gold,
    characterShopSlots: buyResult.nextCampState.characterShopSlots,
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
