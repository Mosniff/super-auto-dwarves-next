import type { GameState } from "@/lib/game/types";
import { parsePersistedCampRoster } from "./parsePersistedCampRoster";
import { parsePersistedCharacterShopSlots } from "./parsePersistedCharacterShopSlots";
import { parsePersistedEnemyEncounter } from "./parsePersistedEnemyEncounter";
import type { LoadedGameRecord } from "./gameRepository";

// The single place a stored record becomes trusted game state: it
// validates the roster, the character shop and the enemy encounter,
// throwing on any malformed one, and requires the encounter in
// battlePhase and its absence in campPhase.
export function buildGameStateFromLoadedRecord(
  loadedGameRecord: LoadedGameRecord,
): GameState {
  const validatedPlayerCampRoster = parsePersistedCampRoster(
    loadedGameRecord.persistedPlayerRoster,
  );
  const validatedCharacterShopSlots = parsePersistedCharacterShopSlots(
    loadedGameRecord.persistedCharacterShopSlots,
  );
  const validatedEnemyEncounter = parsePersistedEnemyEncounter(
    loadedGameRecord.persistedEnemyEncounter,
  );

  // A battle always has its stored enemy, and a camp never does (Phase 13).
  if (
    (loadedGameRecord.phase === "battlePhase") !==
    (validatedEnemyEncounter !== null)
  ) {
    throw new Error(
      `A ${loadedGameRecord.phase} game must ${
        loadedGameRecord.phase === "battlePhase" ? "have" : "not have"
      } a stored enemy encounter.`,
    );
  }

  return {
    playerRoster: validatedPlayerCampRoster,
    gold: loadedGameRecord.gold,
    day: loadedGameRecord.day,
    depth: loadedGameRecord.depth,
    phase: loadedGameRecord.phase,
    characterShopSlots: validatedCharacterShopSlots,
    enemyEncounter: validatedEnemyEncounter,
  };
}
