import { describe, it, expect } from "vitest";
import type { Character } from "./character";
import {
  CHARACTER_LEVELS,
  EXPERIENCE_REQUIRED_PER_LEVEL_UP,
  MAX_CHARACTER_EXPERIENCE,
  MAX_CHARACTER_LEVEL,
  addExperience,
  characterLevelProgressFromExperience,
  gainExperience,
  isCharacterExperience,
  levelFromExperience,
  mergeCharacterInto,
} from "./characterExperience";

function didThrow(runInvalidCall: () => unknown): boolean {
  try {
    runInvalidCall();
    return false;
  } catch {
    return true;
  }
}

function buildFixtureCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: "fixture-character",
    characterTemplateId: "fixture-dwarf",
    name: "Fixture Dwarf",
    tier: 1,
    characterClassIds: ["warrior"],
    attack: 4,
    hp: 7,
    maxHp: 7,
    experience: 0,
    ...overrides,
  };
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

  it("E12: gainExperience below the cap", () => {
    const fixtureCharacter = buildFixtureCharacter({ experience: 0 });

    expect(gainExperience(fixtureCharacter, 1)).toEqual(
      buildFixtureCharacter({ experience: 1, attack: 5, hp: 8, maxHp: 8 }),
    );
  });

  it("E13: gainExperience raises current hp by the same amount, so damage is kept", () => {
    const fixtureCharacter = buildFixtureCharacter({
      experience: 2,
      hp: 3,
      maxHp: 7,
      attack: 4,
    });

    expect(gainExperience(fixtureCharacter, 3)).toEqual(
      buildFixtureCharacter({
        experience: 5,
        attack: 7,
        hp: 6,
        maxHp: 10,
      }),
    );
  });

  it("E14: gainExperience caps at 15 and gives stats only for XP actually gained", () => {
    const additions: Array<[Character, number]> = [
      [
        buildFixtureCharacter({ experience: 13, attack: 4, hp: 7, maxHp: 7 }),
        16,
      ],
      [
        buildFixtureCharacter({ experience: 15, attack: 4, hp: 7, maxHp: 7 }),
        1,
      ],
    ];

    expect(
      additions.map(([character, experienceToAdd]) =>
        gainExperience(character, experienceToAdd),
      ),
    ).toEqual([
      buildFixtureCharacter({ experience: 15, attack: 6, hp: 9, maxHp: 9 }),
      buildFixtureCharacter({ experience: 15, attack: 4, hp: 7, maxHp: 7 }),
    ]);
  });

  it("E15: gainExperience does not mutate its input", () => {
    const fixtureCharacter = buildFixtureCharacter({ experience: 0 });
    const clonedFixtureCharacter = structuredClone(fixtureCharacter);

    gainExperience(fixtureCharacter, 2);

    expect(fixtureCharacter).toEqual(clonedFixtureCharacter);
  });

  it("E16: gainExperience throws for invalid input", () => {
    const invalidCalls: Array<[Character, number]> = [
      [buildFixtureCharacter({ experience: 0 }), 0],
      [buildFixtureCharacter({ experience: 0 }), -1],
      [buildFixtureCharacter({ experience: 16 }), 1],
    ];

    expect(
      invalidCalls.map(([character, experienceToAdd]) =>
        didThrow(() => gainExperience(character, experienceToAdd)),
      ),
    ).toEqual([true, true, true]);
  });

  it("E17: mergeCharacterInto gives the target the consumed character's experience + 1 and keeps the target's identity", () => {
    const targetCharacter = buildFixtureCharacter({
      id: "target",
      name: "Target Dwarf",
      experience: 2,
      attack: 6,
      hp: 9,
      maxHp: 9,
    });
    const consumedCharacter = buildFixtureCharacter({
      id: "consumed",
      name: "Consumed Dwarf",
      experience: 4,
    });

    expect(mergeCharacterInto(targetCharacter, consumedCharacter)).toEqual(
      buildFixtureCharacter({
        id: "target",
        name: "Target Dwarf",
        experience: 7,
        attack: 11,
        hp: 14,
        maxHp: 14,
      }),
    );
  });

  it("E18: mergeCharacterInto caps at 15", () => {
    const targetCharacter = buildFixtureCharacter({
      experience: 10,
      attack: 4,
      hp: 7,
      maxHp: 7,
    });
    const consumedCharacter = buildFixtureCharacter({ experience: 15 });

    expect(mergeCharacterInto(targetCharacter, consumedCharacter)).toEqual(
      buildFixtureCharacter({
        experience: 15,
        attack: 9,
        hp: 12,
        maxHp: 12,
      }),
    );
  });

  it("E19: mergeCharacterInto throws when the templates differ", () => {
    const targetCharacter = buildFixtureCharacter();
    const consumedCharacter = buildFixtureCharacter({
      characterTemplateId: "some-other-dwarf",
    });

    expect(
      [
        didThrow(() => mergeCharacterInto(targetCharacter, consumedCharacter)),
      ],
    ).toEqual([true]);
  });
});
