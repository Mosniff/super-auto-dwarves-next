import { isCharacterClassId } from "@/lib/game/characterClasses";
import { isCharacterTier } from "@/lib/game/characterTiers";
import type { Character } from "@/lib/game/character";
import { CAMP_ROSTER_SLOT_COUNT, type CampRoster } from "@/lib/game/campRoster";

// Owned characters have no upper bound on their number of classes — only
// templates are capped at 3 — so this only checks length >= 1, validity and
// no duplicates.
function hasValidCharacterClassIds(characterClassIds: unknown): boolean {
  return (
    Array.isArray(characterClassIds) &&
    characterClassIds.length >= 1 &&
    characterClassIds.every((classId) => isCharacterClassId(classId)) &&
    new Set(characterClassIds).size === characterClassIds.length
  );
}

// The only validator for a persisted character (the old battle-roster
// parser was removed in Phase 8). Template existence is deliberately not
// checked here — owned characters are self-contained and may diverge from
// their template, so characterTemplateId only needs to be a non-empty
// string.
function isValidPersistedCharacter(
  candidateCharacter: unknown,
): candidateCharacter is Character {
  if (
    typeof candidateCharacter !== "object" ||
    candidateCharacter === null ||
    Array.isArray(candidateCharacter)
  ) {
    return false;
  }

  const {
    id,
    name,
    attack,
    hp,
    maxHp,
    characterTemplateId,
    tier,
    characterClassIds,
  } = candidateCharacter as Record<string, unknown>;

  return (
    typeof id === "string" &&
    typeof name === "string" &&
    typeof attack === "number" &&
    Number.isFinite(attack) &&
    typeof hp === "number" &&
    Number.isFinite(hp) &&
    typeof maxHp === "number" &&
    Number.isFinite(maxHp) &&
    typeof characterTemplateId === "string" &&
    characterTemplateId.length > 0 &&
    isCharacterTier(tier) &&
    hasValidCharacterClassIds(characterClassIds)
  );
}

export function parsePersistedCampRoster(persistedValue: unknown): CampRoster {
  if (!Array.isArray(persistedValue)) {
    throw new Error("Persisted camp roster must be an array.");
  }

  if (persistedValue.length !== CAMP_ROSTER_SLOT_COUNT) {
    throw new Error(
      `Persisted camp roster must have exactly ${CAMP_ROSTER_SLOT_COUNT} slots.`,
    );
  }

  persistedValue.forEach((candidateSlot, slotIndex) => {
    if (candidateSlot === null) {
      return;
    }

    if (!isValidPersistedCharacter(candidateSlot)) {
      throw new Error(
        `Persisted camp roster has an invalid slot at index ${slotIndex}.`,
      );
    }
  });

  return persistedValue as CampRoster;
}
