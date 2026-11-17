import type { Character } from "./character";
import type { CharacterAbility } from "./characterAbilities";
import { findCharacterAbilityForCharacter } from "./characterAbilityLookup";
import { applyExperienceGainAbility } from "./experienceGainAbilities";

export const CHARACTER_LEVELS = [1, 2, 3, 4, 5] as const;

export type CharacterLevel = (typeof CHARACTER_LEVELS)[number];

export const MAX_CHARACTER_LEVEL: CharacterLevel = 5;

// Index 0 is the XP cost of level 1 → 2, index 1 is 2 → 3, and so on.
export const EXPERIENCE_REQUIRED_PER_LEVEL_UP = [3, 3, 4, 5] as const;

export const MAX_CHARACTER_EXPERIENCE = EXPERIENCE_REQUIRED_PER_LEVEL_UP.reduce(
  (totalExperience, experienceForLevelUp) => totalExperience + experienceForLevelUp,
  0,
);

export function isCharacterExperience(
  candidateExperience: unknown,
): candidateExperience is number {
  return (
    typeof candidateExperience === "number" &&
    Number.isInteger(candidateExperience) &&
    candidateExperience >= 0 &&
    candidateExperience <= MAX_CHARACTER_EXPERIENCE
  );
}

// These throws are programmer errors (bad wiring), not rule rejections.
function assertValidExperience(experience: number): void {
  if (!isCharacterExperience(experience)) {
    throw new Error(`invalid character experience: ${experience}`);
  }
}

export function levelFromExperience(experience: number): CharacterLevel {
  assertValidExperience(experience);

  return characterLevelProgressFromExperience(experience).level;
}

export type CharacterLevelProgress =
  | {
      progressKind: "levelling";
      level: CharacterLevel;
      experienceIntoLevel: number;
      experienceRequiredForNextLevel: number;
    }
  | { progressKind: "maxLevel"; level: CharacterLevel };

export function characterLevelProgressFromExperience(
  experience: number,
): CharacterLevelProgress {
  assertValidExperience(experience);

  let remainingExperience = experience;

  for (
    let levelUpIndex = 0;
    levelUpIndex < EXPERIENCE_REQUIRED_PER_LEVEL_UP.length;
    levelUpIndex += 1
  ) {
    const experienceRequiredForNextLevel =
      EXPERIENCE_REQUIRED_PER_LEVEL_UP[levelUpIndex];

    if (remainingExperience < experienceRequiredForNextLevel) {
      // levelUpIndex counts completed level-ups, so the current level is
      // always one more than it, and always within CHARACTER_LEVELS since
      // the loop stops before exhausting EXPERIENCE_REQUIRED_PER_LEVEL_UP.
      const level = (levelUpIndex + 1) as CharacterLevel;

      return {
        progressKind: "levelling",
        level,
        experienceIntoLevel: remainingExperience,
        experienceRequiredForNextLevel,
      };
    }

    remainingExperience -= experienceRequiredForNextLevel;
  }

  return { progressKind: "maxLevel", level: MAX_CHARACTER_LEVEL };
}

export interface ExperienceAddition {
  resultingExperience: number;
  experienceGained: number;
}

export function addExperience(
  currentExperience: number,
  experienceToAdd: number,
): ExperienceAddition {
  assertValidExperience(currentExperience);

  if (!Number.isInteger(experienceToAdd) || experienceToAdd <= 0) {
    throw new Error(`invalid experience to add: ${experienceToAdd}`);
  }

  const resultingExperience = Math.min(
    currentExperience + experienceToAdd,
    MAX_CHARACTER_EXPERIENCE,
  );

  return {
    resultingExperience,
    experienceGained: resultingExperience - currentExperience,
  };
}

// +1 attack, +1 max hp and +1 current hp per XP point (Phase 11 ruling);
// display code (the Phase 12 extra-hp floater) reads this rather than
// assuming 1.
export const BASE_STAT_GAIN_PER_EXPERIENCE_POINT = 1;

// Ruling: +1 attack, +1 max hp and +1 current hp per XP point actually
// gained, so a full-health dwarf stays full and a damaged one keeps its
// damage. onExperienceGain fires once per XP point gained, one point at a
// time, at the strength of the dwarf's level before that point is added
// (XP 2 → 3 fires at level-1 strength). Points lost to the 15-XP cap
// don't fire.
export function gainExperience(
  character: Character,
  experienceToAdd: number,
  findAbility: (
    character: Character,
  ) => CharacterAbility | undefined = findCharacterAbilityForCharacter,
): Character {
  const { experienceGained } = addExperience(
    character.experience,
    experienceToAdd,
  );

  const ability = findAbility(character);

  let currentCharacter = character;

  for (
    let pointIndex = 0;
    pointIndex < experienceGained;
    pointIndex += 1
  ) {
    const levelBeforePoint = levelFromExperience(currentCharacter.experience);

    currentCharacter = {
      ...currentCharacter,
      experience: currentCharacter.experience + 1,
      attack: currentCharacter.attack + BASE_STAT_GAIN_PER_EXPERIENCE_POINT,
      hp: currentCharacter.hp + BASE_STAT_GAIN_PER_EXPERIENCE_POINT,
      maxHp: currentCharacter.maxHp + BASE_STAT_GAIN_PER_EXPERIENCE_POINT,
    };

    if (ability?.trigger === "onExperienceGain") {
      currentCharacter = applyExperienceGainAbility(
        ability,
        currentCharacter,
        levelBeforePoint,
      );
    }
  }

  return currentCharacter;
}

// Encodes the ruling: the target gains the consumed character's XP + 1, and
// keeps its own id, name and slot. A fresh hire has 0 XP, so a merge-buy
// gives exactly 1 XP. The template check here is a programmer-error guard;
// the rules check matching first and return rejections. The max-level rule
// lives in the callers' rules, not here.
export function mergeCharacterInto(
  targetCharacter: Character,
  consumedCharacter: Character,
  findAbility: (
    character: Character,
  ) => CharacterAbility | undefined = findCharacterAbilityForCharacter,
): Character {
  if (targetCharacter.characterTemplateId !== consumedCharacter.characterTemplateId) {
    throw new Error(
      `cannot merge mismatched characters: ${targetCharacter.characterTemplateId} vs ${consumedCharacter.characterTemplateId}`,
    );
  }

  return gainExperience(
    targetCharacter,
    consumedCharacter.experience + 1,
    findAbility,
  );
}
