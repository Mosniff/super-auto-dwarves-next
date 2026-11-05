import { describe, it, expect } from "vitest";
import type { Character } from "@/lib/battle/types";
import { createEmptyCampRoster, type CampRoster } from "@/lib/game/campRoster";
import { parsePersistedCampRoster } from "./parsePersistedCampRoster";

function buildFixtureCharacter(id: string, name: string): Character {
  return {
    id,
    name,
    attack: 1,
    hp: 10,
    maxHp: 10,
  };
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
      { id: "character-a", name: "Dwarf A", attack: "3", hp: 10, maxHp: 10 },
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
});
