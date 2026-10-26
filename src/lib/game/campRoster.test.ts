import { describe, it, expect } from "vitest";
import type { Character } from "@/lib/battle/types";
import {
  CAMP_ROSTER_SLOT_COUNT,
  createEmptyCampRoster,
  squeezeCampRoster,
  type CampRoster,
} from "./campRoster";

function buildFixtureCharacter(id: string, name: string): Character {
  return {
    id,
    name,
    attack: 1,
    hp: 10,
    maxHp: 10,
  };
}

describe("createEmptyCampRoster", () => {
  it("(a) returns CAMP_ROSTER_SLOT_COUNT slots, all empty", () => {
    const emptyCampRoster = createEmptyCampRoster();

    expect(emptyCampRoster).toEqual(
      Array.from({ length: CAMP_ROSTER_SLOT_COUNT }, () => null),
    );
  });

  it("(b) returns a fresh array each call", () => {
    const firstCampRoster = createEmptyCampRoster();
    const frontCharacter = buildFixtureCharacter("front-1", "Frontline Dwarf");
    firstCampRoster[0] = frontCharacter;

    const secondCampRoster = createEmptyCampRoster();

    expect(secondCampRoster).toEqual(
      Array.from({ length: CAMP_ROSTER_SLOT_COUNT }, () => null),
    );
  });
});

describe("squeezeCampRoster", () => {
  it("(c) squeezes an all-empty camp roster into an empty battle roster", () => {
    const allEmptyCampRoster: CampRoster = Array.from(
      { length: CAMP_ROSTER_SLOT_COUNT },
      () => null,
    );

    const squeezedRoster = squeezeCampRoster(allEmptyCampRoster);

    expect(squeezedRoster).toEqual({
      activeCharacters: [],
      downedCharacters: [],
    });
  });

  it("(d) keeps a full, gapless camp roster in the same order", () => {
    const sevenDistinctCharacters = [
      buildFixtureCharacter("character-1", "Dwarf One"),
      buildFixtureCharacter("character-2", "Dwarf Two"),
      buildFixtureCharacter("character-3", "Dwarf Three"),
      buildFixtureCharacter("character-4", "Dwarf Four"),
      buildFixtureCharacter("character-5", "Dwarf Five"),
      buildFixtureCharacter("character-6", "Dwarf Six"),
      buildFixtureCharacter("character-7", "Dwarf Seven"),
    ];
    const fullCampRoster: CampRoster = sevenDistinctCharacters;

    const squeezedRoster = squeezeCampRoster(fullCampRoster);

    expect(
      squeezedRoster.activeCharacters.map((character) => character.id),
    ).toEqual(sevenDistinctCharacters.map((character) => character.id));
    expect(squeezedRoster.downedCharacters).toEqual([]);
  });

  it("(e) closes gaps between characters, preserving front-to-back order", () => {
    const frontCharacter = buildFixtureCharacter("character-a", "Dwarf A");
    const middleCharacter = buildFixtureCharacter("character-b", "Dwarf B");
    const backCharacter = buildFixtureCharacter("character-c", "Dwarf C");
    const campRosterWithGaps: CampRoster = [
      frontCharacter,
      null,
      middleCharacter,
      null,
      null,
      backCharacter,
      null,
    ];

    const squeezedRoster = squeezeCampRoster(campRosterWithGaps);

    expect(
      squeezedRoster.activeCharacters.map((character) => character.id),
    ).toEqual([frontCharacter.id, middleCharacter.id, backCharacter.id]);
  });

  it("(f) moves characters forward when the front slots are empty", () => {
    const firstCharacter = buildFixtureCharacter("character-a", "Dwarf A");
    const secondCharacter = buildFixtureCharacter("character-b", "Dwarf B");
    const campRosterWithEmptyFrontSlots: CampRoster = [
      null,
      null,
      firstCharacter,
      null,
      secondCharacter,
      null,
      null,
    ];

    const squeezedRoster = squeezeCampRoster(campRosterWithEmptyFrontSlots);

    expect(
      squeezedRoster.activeCharacters.map((character) => character.id),
    ).toEqual([firstCharacter.id, secondCharacter.id]);
  });

  it("(g) keeps duplicate-named characters as separate entries by id", () => {
    const firstDuplicateNamedCharacter = buildFixtureCharacter(
      "character-a",
      "Duplicate Dwarf",
    );
    const secondDuplicateNamedCharacter = buildFixtureCharacter(
      "character-b",
      "Duplicate Dwarf",
    );
    const campRosterWithDuplicateNames: CampRoster = [
      firstDuplicateNamedCharacter,
      null,
      secondDuplicateNamedCharacter,
      null,
      null,
      null,
      null,
    ];

    const squeezedRoster = squeezeCampRoster(campRosterWithDuplicateNames);

    expect(
      squeezedRoster.activeCharacters.map((character) => character.id),
    ).toEqual([
      firstDuplicateNamedCharacter.id,
      secondDuplicateNamedCharacter.id,
    ]);
  });

  it("(h) does not mutate the input camp roster", () => {
    const frontCharacter = buildFixtureCharacter("character-a", "Dwarf A");
    const backCharacter = buildFixtureCharacter("character-c", "Dwarf C");
    const campRosterWithGaps: CampRoster = [
      frontCharacter,
      null,
      backCharacter,
      null,
      null,
      null,
      null,
    ];
    const campRosterClone = structuredClone(campRosterWithGaps);

    squeezeCampRoster(campRosterWithGaps);

    expect(campRosterWithGaps).toEqual(campRosterClone);
  });
});
