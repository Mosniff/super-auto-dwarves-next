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

export type HpDisplayTone = "damaged" | "full" | "buffed";

// Display-only; "buffed" can't occur while maxHp is a hard ceiling, but is
// wanted for future effects.
export function hpDisplayTone(hp: number, maxHp: number): HpDisplayTone {
  if (hp < maxHp) {
    return "damaged";
  }
  if (hp > maxHp) {
    return "buffed";
  }
  return "full";
}
