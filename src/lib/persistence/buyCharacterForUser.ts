import { buyCharacter, type BuyCharacterRejectionReason } from "@/lib/game/buyCharacter";
import type { ShopListing } from "@/lib/game/shop";
import { buildGameStateFromLoadedRecord } from "./buildGameStateFromLoadedRecord";
import type { GameRepository } from "./gameRepository";

export interface BuyCharacterIntent {
  shopListingId: string;
  targetSlotIndex: number;
  expectedRevision: number;
}

export interface BuyCharacterDependencies {
  gameRepository: GameRepository;
  shopCatalogue: ShopListing[];
  generateCharacterId: () => string;
}

export type BuyCharacterForUserResult =
  | { outcome: "accepted" }
  | { outcome: "rejected"; rejectionReason: BuyCharacterRejectionReason }
  | { outcome: "stale" };

// Server-authority seam (CLAUDE.md -> "Security / anti-cheat model"): the
// caller supplies only the user id and an intent, never state. Prices and
// the catalogue come from the server (buyCharacterDependencies), never the
// client.
//
// Check order: load; no game throws; an intent outside campPhase, or a
// stale expected revision, is treated as stale; the loaded record is built
// into trusted game state (a malformed roster throws); the pure rule runs
// and a rejection is returned without saving; an accepted rule result is
// saved conditionally on the loaded revision, and a lost race (false) is
// also reported as stale.
export async function buyCharacterForUser(
  userId: string,
  buyCharacterIntent: BuyCharacterIntent,
  buyCharacterDependencies: BuyCharacterDependencies,
): Promise<BuyCharacterForUserResult> {
  const { gameRepository, shopCatalogue, generateCharacterId } =
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

  const buyResult = buyCharacter(
    {
      campRoster: currentGameState.playerRoster,
      gold: currentGameState.gold,
      purchasedShopListingIds: currentGameState.purchasedShopListingIds,
    },
    shopCatalogue,
    buyCharacterIntent.shopListingId,
    buyCharacterIntent.targetSlotIndex,
    generateCharacterId(),
  );

  if (buyResult.outcome === "rejected") {
    return { outcome: "rejected", rejectionReason: buyResult.rejectionReason };
  }

  const nextGameState = {
    ...currentGameState,
    playerRoster: buyResult.nextCampState.campRoster,
    gold: buyResult.nextCampState.gold,
    purchasedShopListingIds: buyResult.nextCampState.purchasedShopListingIds,
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
