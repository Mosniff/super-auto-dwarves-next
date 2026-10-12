import type { Character, Roster } from "@/lib/battle/types";

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

function assertValidCharacterArray(
  candidateCharacterArray: unknown,
  arrayFieldName: "activeCharacters" | "downedCharacters",
): void {
  if (!Array.isArray(candidateCharacterArray)) {
    throw new Error(
      `Persisted roster field "${arrayFieldName}" must be an array.`,
    );
  }

  candidateCharacterArray.forEach((candidateCharacter, characterIndex) => {
    if (!isValidPersistedCharacter(candidateCharacter)) {
      throw new Error(
        `Persisted roster field "${arrayFieldName}" has an invalid character at index ${characterIndex}.`,
      );
    }
  });
}

export function parsePersistedRoster(persistedValue: unknown): Roster {
  if (
    typeof persistedValue !== "object" ||
    persistedValue === null ||
    Array.isArray(persistedValue)
  ) {
    throw new Error("Persisted roster must be a non-null, non-array object.");
  }

  const { activeCharacters, downedCharacters } = persistedValue as Record<
    string,
    unknown
  >;

  assertValidCharacterArray(activeCharacters, "activeCharacters");
  assertValidCharacterArray(downedCharacters, "downedCharacters");

  return persistedValue as Roster;
}
