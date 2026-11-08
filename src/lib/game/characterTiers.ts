export const CHARACTER_TIERS = [1, 2, 3, 4, 5] as const;

export type CharacterTier = (typeof CHARACTER_TIERS)[number];

export function isCharacterTier(
  candidateTier: unknown,
): candidateTier is CharacterTier {
  return (
    typeof candidateTier === "number" &&
    (CHARACTER_TIERS as readonly number[]).includes(candidateTier)
  );
}
