import type { CharacterTier } from "@/lib/game/characterTiers";
import {
  EXPERIENCE_REQUIRED_PER_LEVEL_UP,
  characterLevelProgressFromExperience,
  levelFromExperience,
  type CharacterLevel,
} from "@/lib/game/characterExperience";

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

export interface ExperienceBarSegments {
  segmentCount: number;
  filledSegmentCount: number;
  isMaxLevel: boolean;
}

// Display-only: splits the XP bar into the current level's chunks so each
// level-up segment reads as its own piece, and shows full at max level.
export function experienceBarSegments(
  experience: number,
): ExperienceBarSegments {
  const levelProgress = characterLevelProgressFromExperience(experience);

  if (levelProgress.progressKind === "maxLevel") {
    const maxLevelSegmentCount =
      EXPERIENCE_REQUIRED_PER_LEVEL_UP[EXPERIENCE_REQUIRED_PER_LEVEL_UP.length - 1];

    return {
      segmentCount: maxLevelSegmentCount,
      filledSegmentCount: maxLevelSegmentCount,
      isMaxLevel: true,
    };
  }

  return {
    segmentCount: levelProgress.experienceRequiredForNextLevel,
    filledSegmentCount: levelProgress.experienceIntoLevel,
    isMaxLevel: false,
  };
}

export type ExperienceBarCaption =
  | {
      progressKind: "levelling";
      experienceRemaining: number;
      nextLevel: CharacterLevel;
    }
  | { progressKind: "maxLevel" };

// Display-only. nextLevel is derived through levelFromExperience rather
// than a "current level + 1" cast, so it can never desync from the level
// rule.
export function experienceBarCaption(
  experience: number,
): ExperienceBarCaption {
  const levelProgress = characterLevelProgressFromExperience(experience);

  if (levelProgress.progressKind === "maxLevel") {
    return { progressKind: "maxLevel" };
  }

  const experienceRemaining =
    levelProgress.experienceRequiredForNextLevel -
    levelProgress.experienceIntoLevel;

  return {
    progressKind: "levelling",
    experienceRemaining,
    nextLevel: levelFromExperience(experience + experienceRemaining),
  };
}
