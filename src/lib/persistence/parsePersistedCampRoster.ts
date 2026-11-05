import type { Character } from "@/lib/battle/types";
import { CAMP_ROSTER_SLOT_COUNT, type CampRoster } from "@/lib/game/campRoster";

// Duplicated from parsePersistedRoster.ts deliberately; that file is
// deleted once nothing reads the old roster shape (Phase 8).
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

  const { id, name, attack, hp, maxHp } = candidateCharacter as Record<
    string,
    unknown
  >;

  return (
    typeof id === "string" &&
    typeof name === "string" &&
    typeof attack === "number" &&
    Number.isFinite(attack) &&
    typeof hp === "number" &&
    Number.isFinite(hp) &&
    typeof maxHp === "number" &&
    Number.isFinite(maxHp)
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
