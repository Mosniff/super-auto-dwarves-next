export const CHARACTER_CLASS_IDS = [
  "warrior",
  "mage",
  "merchant",
  "smith",
  "miner",
] as const;

export type CharacterClassId = (typeof CHARACTER_CLASS_IDS)[number];

export function isCharacterClassId(
  candidateClassId: unknown,
): candidateClassId is CharacterClassId {
  return (
    typeof candidateClassId === "string" &&
    (CHARACTER_CLASS_IDS as readonly string[]).includes(candidateClassId)
  );
}
