import { describe, it, expect } from "vitest";
import type { Character } from "@/lib/game/character";
import { createEmptyCampRoster, type CampRoster } from "@/lib/game/campRoster";
import { parsePersistedCampRoster } from "./parsePersistedCampRoster";

function buildFixtureCharacter(id: string, name: string): Character {
  return {
    id,
    name,
    attack: 1,
    hp: 10,
    maxHp: 10,
    characterTemplateId: "fixture-dwarf",
    tier: 1,
    characterClassIds: ["warrior"],
  };
}

function buildRosterWithFirstSlot(candidateSlot: unknown): unknown[] {
  return [candidateSlot, null, null, null, null, null, null];
}

function doesParseThrow(persistedValue: unknown): boolean {
  try {
    parsePersistedCampRoster(persistedValue);
    return false;
  } catch {
    return true;
  }
}

describe("parsePersistedCampRoster", () => {
  it("(a) returns a valid seven-slot camp roster with characters and gaps unchanged", () => {
    const characterA = buildFixtureCharacter("character-a", "Dwarf A");
    const characterB = buildFixtureCharacter("character-b", "Dwarf B");
    const characterC = buildFixtureCharacter("character-c", "Dwarf C");
    const persistedCampRosterWithGaps: unknown = [
      characterA,
      null,
      characterB,
      null,
      null,
      null,
      characterC,
    ];

    const parsedCampRoster = parsePersistedCampRoster(
      persistedCampRosterWithGaps,
    );

    expect(parsedCampRoster).toEqual(persistedCampRosterWithGaps);
  });

  it("(b) accepts a camp roster of seven empty slots", () => {
    const allEmptyCampRoster: CampRoster = createEmptyCampRoster();

    const parsedCampRoster = parsePersistedCampRoster(allEmptyCampRoster);

    expect(parsedCampRoster).toEqual(allEmptyCampRoster);
  });

  it("(c) throws when the value is not an array", () => {
    expect(() => parsePersistedCampRoster(null)).toThrow();
    expect(() => parsePersistedCampRoster({})).toThrow();
    expect(() => parsePersistedCampRoster("roster")).toThrow();
  });

  it("(d) throws when the array has fewer than seven slots", () => {
    const tooShortCampRoster: unknown = [null, null, null, null, null, null];

    expect(() => parsePersistedCampRoster(tooShortCampRoster)).toThrow();
  });

  it("(e) throws when the array has more than seven slots", () => {
    const tooLongCampRoster: unknown = [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ];

    expect(() => parsePersistedCampRoster(tooLongCampRoster)).toThrow();
  });

  it("(f) throws when a slot is neither null nor a character", () => {
    const campRosterWithInvalidSlot: unknown = [
      null,
      null,
      null,
      5,
      null,
      null,
      null,
    ];

    expect(() => parsePersistedCampRoster(campRosterWithInvalidSlot)).toThrow();
  });

  it("(g) throws when a character field has the wrong type", () => {
    const campRosterWithWrongFieldType: unknown = [
      {
        id: "character-a",
        name: "Dwarf A",
        attack: "3",
        hp: 10,
        maxHp: 10,
        characterTemplateId: "fixture-dwarf",
        tier: 1,
        characterClassIds: ["warrior"],
      },
      null,
      null,
      null,
      null,
      null,
      null,
    ];

    expect(() =>
      parsePersistedCampRoster(campRosterWithWrongFieldType),
    ).toThrow();
  });

  it("(h) throws when given the old battle-roster shape", () => {
    const oldBattleRosterShape: unknown = {
      activeCharacters: [],
      downedCharacters: [],
    };

    expect(() => parsePersistedCampRoster(oldBattleRosterShape)).toThrow();
  });

  it("(i) throws when characterTemplateId is missing, the wrong type, or empty", () => {
    const baseCharacter = buildFixtureCharacter("character-a", "Dwarf A");
    const characterWithoutTemplateId: Record<string, unknown> = {
      ...baseCharacter,
    };
    delete characterWithoutTemplateId.characterTemplateId;

    const variants: unknown[] = [
      characterWithoutTemplateId,
      { ...baseCharacter, characterTemplateId: 5 },
      { ...baseCharacter, characterTemplateId: "" },
    ];

    expect(variants.map(buildRosterWithFirstSlot).map(doesParseThrow)).toEqual(
      [true, true, true],
    );
  });

  it("(j) throws when tier is missing, out of range, or the wrong type", () => {
    const baseCharacter = buildFixtureCharacter("character-a", "Dwarf A");
    const characterWithoutTier: Record<string, unknown> = { ...baseCharacter };
    delete characterWithoutTier.tier;

    const variants: unknown[] = [
      characterWithoutTier,
      { ...baseCharacter, tier: 0 },
      { ...baseCharacter, tier: 6 },
      { ...baseCharacter, tier: 1.5 },
      { ...baseCharacter, tier: "1" },
    ];

    expect(variants.map(buildRosterWithFirstSlot).map(doesParseThrow)).toEqual(
      [true, true, true, true, true],
    );
  });

  it("(k) throws when characterClassIds is missing, empty, invalid or has duplicates", () => {
    const baseCharacter = buildFixtureCharacter("character-a", "Dwarf A");
    const characterWithoutClassIds: Record<string, unknown> = {
      ...baseCharacter,
    };
    delete characterWithoutClassIds.characterClassIds;

    const variants: unknown[] = [
      characterWithoutClassIds,
      { ...baseCharacter, characterClassIds: "warrior" },
      { ...baseCharacter, characterClassIds: [] },
      { ...baseCharacter, characterClassIds: ["rogue"] },
      { ...baseCharacter, characterClassIds: ["Warrior"] },
      { ...baseCharacter, characterClassIds: ["warrior", "warrior"] },
    ];

    expect(variants.map(buildRosterWithFirstSlot).map(doesParseThrow)).toEqual(
      [true, true, true, true, true, true],
    );
  });

  it("(l) accepts an owned character with more than three distinct classes", () => {
    const characterWithFourClasses: Character = {
      ...buildFixtureCharacter("character-a", "Dwarf A"),
      characterClassIds: ["warrior", "mage", "merchant", "smith"],
    };
    const persistedCampRoster = buildRosterWithFirstSlot(
      characterWithFourClasses,
    );

    const parsedCampRoster = parsePersistedCampRoster(persistedCampRoster);

    expect(parsedCampRoster).toEqual(persistedCampRoster);
  });
});
