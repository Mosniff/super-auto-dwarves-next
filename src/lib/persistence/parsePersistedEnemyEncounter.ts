import { isCharacterFactionId } from "@/lib/game/characterFactions";
import { CAMP_ROSTER_SLOT_COUNT } from "@/lib/game/campRoster";
import {
  MAX_BATTLE_SEED,
  type EnemyEncounter,
} from "@/lib/game/enemyEncounter";
import { isValidPersistedCharacter } from "./parsePersistedCampRoster";

// Validates the stored enemy encounter: null (no battle in progress) or
// { enemyFactionId, enemyCharacters, battleSeed } with a known faction, 1
// to 7 valid characters (the same validator as the camp roster's) and an
// unsigned 32-bit integer seed. Throws on anything else (Phase 13).
export function parsePersistedEnemyEncounter(
  persistedValue: unknown,
): EnemyEncounter | null {
  if (persistedValue === null) {
    return null;
  }

  if (
    typeof persistedValue !== "object" ||
    Array.isArray(persistedValue)
  ) {
    throw new Error("Persisted enemy encounter must be an object or null.");
  }

  const { enemyFactionId, enemyCharacters, battleSeed } =
    persistedValue as Record<string, unknown>;

  if (!isCharacterFactionId(enemyFactionId)) {
    throw new Error("Persisted enemy encounter has an invalid faction.");
  }

  if (
    !Array.isArray(enemyCharacters) ||
    enemyCharacters.length < 1 ||
    enemyCharacters.length > CAMP_ROSTER_SLOT_COUNT ||
    !enemyCharacters.every((candidateCharacter) =>
      isValidPersistedCharacter(candidateCharacter),
    )
  ) {
    throw new Error(
      `Persisted enemy encounter must have 1 to ${CAMP_ROSTER_SLOT_COUNT} valid characters.`,
    );
  }

  if (
    typeof battleSeed !== "number" ||
    !Number.isInteger(battleSeed) ||
    battleSeed < 0 ||
    battleSeed > MAX_BATTLE_SEED
  ) {
    throw new Error("Persisted enemy encounter has an invalid battle seed.");
  }

  return { enemyFactionId, enemyCharacters, battleSeed };
}
