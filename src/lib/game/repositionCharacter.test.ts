import { describe, it, expect } from "vitest";
import type { Character } from "@/lib/battle/types";
import { createEmptyCampRoster, type CampRoster } from "./campRoster";
import { repositionCharacter } from "./repositionCharacter";

function buildFixtureCharacter(id: string, name: string): Character {
  return {
    id,
    name,
    attack: 1,
    hp: 10,
    maxHp: 10,
  };
}

describe("repositionCharacter", () => {
  it("(l) moves a character to an empty slot, leaving its old slot empty", () => {
    const frontCharacter = buildFixtureCharacter("character-a", "Dwarf A");
    const campRosterWithFrontCharacter: CampRoster = createEmptyCampRoster();
    campRosterWithFrontCharacter[0] = frontCharacter;

    const repositionResult = repositionCharacter(
      campRosterWithFrontCharacter,
      0,
      5,
    );

    const expectedCampRoster: CampRoster = [
      null,
      null,
      null,
      null,
      null,
      frontCharacter,
      null,
    ];

    expect(repositionResult).toEqual({
      outcome: "accepted",
      nextCampRoster: expectedCampRoster,
    });
  });

  it("(m) swaps two characters when moving onto an occupied slot", () => {
    const firstCharacter = buildFixtureCharacter("character-a", "Dwarf A");
    const secondCharacter = buildFixtureCharacter("character-b", "Dwarf B");
    const campRosterWithTwoCharacters: CampRoster = createEmptyCampRoster();
    campRosterWithTwoCharacters[1] = firstCharacter;
    campRosterWithTwoCharacters[4] = secondCharacter;

    const repositionResult = repositionCharacter(
      campRosterWithTwoCharacters,
      1,
      4,
    );

    const expectedCampRoster: CampRoster = [
      null,
      secondCharacter,
      null,
      null,
      firstCharacter,
      null,
      null,
    ];

    expect(repositionResult).toEqual({
      outcome: "accepted",
      nextCampRoster: expectedCampRoster,
    });
  });

  it("(n) rejects moving from an empty slot", () => {
    const allEmptyCampRoster: CampRoster = createEmptyCampRoster();

    const repositionResult = repositionCharacter(allEmptyCampRoster, 0, 5);

    expect(repositionResult).toEqual({
      outcome: "rejected",
      rejectionReason: "sourceSlotEmpty",
    });
  });

  it("(o) rejects moving a character to the slot it is already in", () => {
    const frontCharacter = buildFixtureCharacter("character-a", "Dwarf A");
    const campRosterWithFrontCharacter: CampRoster = createEmptyCampRoster();
    campRosterWithFrontCharacter[0] = frontCharacter;

    const repositionResult = repositionCharacter(
      campRosterWithFrontCharacter,
      0,
      0,
    );

    expect(repositionResult).toEqual({
      outcome: "rejected",
      rejectionReason: "sameSlot",
    });
  });

  it("(p) rejects slot indices outside the roster", () => {
    const frontCharacter = buildFixtureCharacter("character-a", "Dwarf A");
    const campRosterWithFrontCharacter: CampRoster = createEmptyCampRoster();
    campRosterWithFrontCharacter[0] = frontCharacter;

    const repositionResultWithFromTooHigh = repositionCharacter(
      campRosterWithFrontCharacter,
      7,
      0,
    );
    const repositionResultWithToTooHigh = repositionCharacter(
      campRosterWithFrontCharacter,
      0,
      7,
    );
    const repositionResultWithFromTooLow = repositionCharacter(
      campRosterWithFrontCharacter,
      -1,
      0,
    );

    expect(repositionResultWithFromTooHigh).toEqual({
      outcome: "rejected",
      rejectionReason: "invalidSlot",
    });
    expect(repositionResultWithToTooHigh).toEqual({
      outcome: "rejected",
      rejectionReason: "invalidSlot",
    });
    expect(repositionResultWithFromTooLow).toEqual({
      outcome: "rejected",
      rejectionReason: "invalidSlot",
    });
  });

  it("(q) rejects non-integer slot indices", () => {
    const frontCharacter = buildFixtureCharacter("character-a", "Dwarf A");
    const campRosterWithFrontCharacter: CampRoster = createEmptyCampRoster();
    campRosterWithFrontCharacter[0] = frontCharacter;

    const repositionResult = repositionCharacter(
      campRosterWithFrontCharacter,
      0.5,
      1,
    );

    expect(repositionResult).toEqual({
      outcome: "rejected",
      rejectionReason: "invalidSlot",
    });
  });

  it("(r) does not mutate the input camp roster", () => {
    const frontCharacter = buildFixtureCharacter("character-a", "Dwarf A");
    const campRosterWithFrontCharacter: CampRoster = createEmptyCampRoster();
    campRosterWithFrontCharacter[0] = frontCharacter;
    const campRosterClone = structuredClone(campRosterWithFrontCharacter);

    repositionCharacter(campRosterWithFrontCharacter, 0, 5);

    expect(campRosterWithFrontCharacter).toEqual(campRosterClone);
  });
});
