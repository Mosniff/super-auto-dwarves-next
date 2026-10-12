import { describe, it, expect } from "vitest";
import { parsePersistedRoster } from "./parsePersistedRoster";

describe("parsePersistedRoster", () => {
  it("returns a valid roster unchanged", () => {
    const validRoster = {
      activeCharacters: [
        { id: "dwarf-1", name: "Borin", attack: 3, hp: 5, maxHp: 5 },
      ],
      downedCharacters: [
        { id: "dwarf-2", name: "Thrain", attack: 2, hp: 0, maxHp: 4 },
      ],
    };

    expect(parsePersistedRoster(validRoster)).toEqual(validRoster);
  });

  it("accepts a roster with both arrays empty", () => {
    const emptyRoster = {
      activeCharacters: [],
      downedCharacters: [],
    };

    expect(parsePersistedRoster(emptyRoster)).toEqual(emptyRoster);
  });

  it("throws when the value is null", () => {
    expect(() => parsePersistedRoster(null)).toThrow();
  });

  it("throws when the value is an array rather than an object", () => {
    expect(() => parsePersistedRoster([])).toThrow();
  });

  it("throws when activeCharacters is missing", () => {
    const rosterMissingActiveCharacters = {
      downedCharacters: [],
    };

    expect(() => parsePersistedRoster(rosterMissingActiveCharacters)).toThrow();
  });

  it("throws when downedCharacters is present but not an array", () => {
    const rosterWithNonArrayDownedCharacters = {
      activeCharacters: [],
      downedCharacters: "not-an-array",
    };

    expect(() =>
      parsePersistedRoster(rosterWithNonArrayDownedCharacters),
    ).toThrow();
  });

  it("throws when a character field has the wrong type", () => {
    const rosterWithWrongTypedHp = {
      activeCharacters: [
        { id: "dwarf-1", name: "Borin", attack: 3, hp: "5", maxHp: 5 },
      ],
      downedCharacters: [],
    };

    expect(() => parsePersistedRoster(rosterWithWrongTypedHp)).toThrow();
  });
});
