import type { GameState } from "@/lib/game/types";
import { parsePersistedCampRoster } from "./parsePersistedCampRoster";
import type { LoadedGameRecord } from "./gameRepository";

// The single place a stored record becomes trusted game state: it
// validates the roster (throwing on a malformed one) and defaults a
// missing purchased-listings value to no purchases.
export function buildGameStateFromLoadedRecord(
  loadedGameRecord: LoadedGameRecord,
): GameState {
  const validatedPlayerCampRoster = parsePersistedCampRoster(
    loadedGameRecord.persistedPlayerRoster,
  );

  return {
    playerRoster: validatedPlayerCampRoster,
    gold: loadedGameRecord.gold,
    day: loadedGameRecord.day,
    phase: loadedGameRecord.phase,
    purchasedShopListingIds: loadedGameRecord.purchasedShopListingIds ?? [],
  };
}
