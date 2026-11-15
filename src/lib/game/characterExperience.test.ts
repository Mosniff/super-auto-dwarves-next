import { describe, it, expect } from "vitest";
import {
  CHARACTER_LEVELS,
  EXPERIENCE_REQUIRED_PER_LEVEL_UP,
  MAX_CHARACTER_EXPERIENCE,
  MAX_CHARACTER_LEVEL,
  addExperience,
  characterLevelProgressFromExperience,
  isCharacterExperience,
  levelFromExperience,
} from "./characterExperience";

function didThrow(runInvalidCall: () => unknown): boolean {
  try {
    runInvalidCall();
    return false;
  } catch {
    return true;
  }
}

describe("characterExperience", () => {
  it("E1: exposes the level and experience constants", () => {
    expect({
      EXPERIENCE_REQUIRED_PER_LEVEL_UP,
      MAX_CHARACTER_EXPERIENCE,
      MAX_CHARACTER_LEVEL,
      CHARACTER_LEVELS,
    }).toEqual({
      EXPERIENCE_REQUIRED_PER_LEVEL_UP: [3, 3, 4, 5],
      MAX_CHARACTER_EXPERIENCE: 15,
      MAX_CHARACTER_LEVEL: 5,
      CHARACTER_LEVELS: [1, 2, 3, 4, 5],
    });
  });

  it("E2: isCharacterExperience accepts every integer from 0 to 15", () => {
    const candidateExperienceValues = Array.from(
      { length: 16 },
      (_, experience) => experience,
    );

    expect(candidateExperienceValues.map(isCharacterExperience)).toEqual(
      candidateExperienceValues.map(() => true),
    );
  });

  it("E3: isCharacterExperience rejects invalid values", () => {
    const invalidValues = [
      -1,
      16,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      "3",
      null,
      undefined,
    ];

    expect(invalidValues.map(isCharacterExperience)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it("E4: levelFromExperience over 0..15", () => {
    const experienceValues = Array.from(
      { length: 16 },
      (_, experience) => experience,
    );

    expect(experienceValues.map(levelFromExperience)).toEqual([
      1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5,
    ]);
  });

  it("E5: levelFromExperience throws for invalid values", () => {
    const invalidValues = [-1, 16, 1.5, Number.NaN];

    expect(
      invalidValues.map((invalidExperience) =>
        didThrow(() => levelFromExperience(invalidExperience)),
      ),
    ).toEqual([true, true, true, true]);
  });

  it("E6: characterLevelProgressFromExperience while levelling", () => {
    const experienceValues = [0, 1, 2, 3, 5, 6, 9, 10, 14];

    expect(
      experienceValues.map((experience) =>
        characterLevelProgressFromExperience(experience),
      ),
    ).toEqual([
      {
        progressKind: "levelling",
        level: 1,
        experienceIntoLevel: 0,
        experienceRequiredForNextLevel: 3,
      },
      {
        progressKind: "levelling",
        level: 1,
        experienceIntoLevel: 1,
        experienceRequiredForNextLevel: 3,
      },
      {
        progressKind: "levelling",
        level: 1,
        experienceIntoLevel: 2,
        experienceRequiredForNextLevel: 3,
      },
      {
        progressKind: "levelling",
        level: 2,
        experienceIntoLevel: 0,
        experienceRequiredForNextLevel: 3,
      },
      {
        progressKind: "levelling",
        level: 2,
        experienceIntoLevel: 2,
        experienceRequiredForNextLevel: 3,
      },
      {
        progressKind: "levelling",
        level: 3,
        experienceIntoLevel: 0,
        experienceRequiredForNextLevel: 4,
      },
      {
        progressKind: "levelling",
        level: 3,
        experienceIntoLevel: 3,
        experienceRequiredForNextLevel: 4,
      },
      {
        progressKind: "levelling",
        level: 4,
        experienceIntoLevel: 0,
        experienceRequiredForNextLevel: 5,
      },
      {
        progressKind: "levelling",
        level: 4,
        experienceIntoLevel: 4,
        experienceRequiredForNextLevel: 5,
      },
    ]);
  });

  it("E7: characterLevelProgressFromExperience at max level", () => {
    expect(characterLevelProgressFromExperience(15)).toEqual({
      progressKind: "maxLevel",
      level: 5,
    });
  });

  it("E8: characterLevelProgressFromExperience throws for invalid values", () => {
    const invalidValues = [-1, 16, 1.5, Number.NaN];

    expect(
      invalidValues.map((invalidExperience) =>
        didThrow(() => characterLevelProgressFromExperience(invalidExperience)),
      ),
    ).toEqual([true, true, true, true]);
  });

  it("E9: addExperience below the cap", () => {
    const additions: Array<[number, number]> = [
      [0, 1],
      [4, 2],
      [5, 10],
    ];

    expect(
      additions.map(([currentExperience, experienceToAdd]) =>
        addExperience(currentExperience, experienceToAdd),
      ),
    ).toEqual([
      { resultingExperience: 1, experienceGained: 1 },
      { resultingExperience: 6, experienceGained: 2 },
      { resultingExperience: 15, experienceGained: 10 },
    ]);
  });

  it("E10: addExperience at and past the cap", () => {
    const additions: Array<[number, number]> = [
      [14, 3],
      [13, 16],
      [15, 1],
    ];

    expect(
      additions.map(([currentExperience, experienceToAdd]) =>
        addExperience(currentExperience, experienceToAdd),
      ),
    ).toEqual([
      { resultingExperience: 15, experienceGained: 1 },
      { resultingExperience: 15, experienceGained: 2 },
      { resultingExperience: 15, experienceGained: 0 },
    ]);
  });

  it("E11: addExperience throws for invalid input", () => {
    const invalidAdditions: Array<[number, number]> = [
      [0, 0],
      [0, -1],
      [0, 1.5],
      [0, Number.NaN],
      [16, 1],
      [-1, 1],
    ];

    expect(
      invalidAdditions.map(([currentExperience, experienceToAdd]) =>
        didThrow(() => addExperience(currentExperience, experienceToAdd)),
      ),
    ).toEqual([true, true, true, true, true, true]);
  });
});
