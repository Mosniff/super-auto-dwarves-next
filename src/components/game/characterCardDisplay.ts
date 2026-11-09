import type { CharacterTier } from "@/lib/game/characterTiers";

const TIER_ROMAN_NUMERALS: Record<CharacterTier, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
};

export function tierRomanNumeral(tier: CharacterTier): string {
  return TIER_ROMAN_NUMERALS[tier];
}
