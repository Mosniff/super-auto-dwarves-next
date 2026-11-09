import type { GameState } from "@/lib/game/types";
import { parsePersistedCampRoster } from "./parsePersistedCampRoster";
import { parsePersistedCharacterShopSlots } from "./parsePersistedCharacterShopSlots";
import type { LoadedGameRecord } from "./gameRepository";

// The single place a stored record becomes trusted game state: it
// validates the roster and the character shop (throwing on either
// malformed one) and defaults a missing purchased-listings value to no
// purchases.
export function buildGameStateFromLoadedRecord(
  loadedGameRecord: LoadedGameRecord,
): GameState {
  const validatedPlayerCampRoster = parsePersistedCampRoster(
    loadedGameRecord.persistedPlayerRoster,
  );
  const validatedCharacterShopSlots = parsePersistedCharacterShopSlots(
    loadedGameRecord.persistedCharacterShopSlots,
  );

  return {
    playerRoster: validatedPlayerCampRoster,
    gold: loadedGameRecord.gold,
    day: loadedGameRecord.day,
    phase: loadedGameRecord.phase,
    purchasedShopListingIds: loadedGameRecord.purchasedShopListingIds ?? [],
    characterShopSlots: validatedCharacterShopSlots,
  };
}
