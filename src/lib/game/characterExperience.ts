import type { Character } from "./character";

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

// Ruling: +1 attack, +1 max hp and +1 current hp per XP point actually
// gained, so a full-health dwarf stays full and a damaged one keeps its
// damage.
export function gainExperience(
  character: Character,
  experienceToAdd: number,
): Character {
  const { resultingExperience, experienceGained } = addExperience(
    character.experience,
    experienceToAdd,
  );

  return {
    ...character,
    experience: resultingExperience,
    attack: character.attack + experienceGained,
    hp: character.hp + experienceGained,
    maxHp: character.maxHp + experienceGained,
  };
}
