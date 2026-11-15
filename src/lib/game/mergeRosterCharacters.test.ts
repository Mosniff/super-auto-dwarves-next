import { describe, it, expect } from "vitest";
import type { Character } from "./character";
import type { CampRoster } from "./campRoster";
import { mergeRosterCharacters } from "./mergeRosterCharacters";

function buildRosterCharacter(
  id: string,
  characterTemplateId: string,
  experience: number,
  attack: number,
  hp: number,
  maxHp: number,
): Character {
  return {
    id,
    name: "Dwarf " + id,
    characterTemplateId,
    tier: 1,
    characterClassIds: ["warrior"],
    attack,
    hp,
    maxHp,
    experience,
  };
}

describe("mergeRosterCharacters", () => {
  it("RM1: merges a matching dwarf into another: the target gains the source's XP + 1, the source slot empties", () => {
    const targetCharacter = buildRosterCharacter(
      "target",
      "fixture-dwarf",
      2,
      6,
      7,
      9,
    );
    const sourceCharacter = buildRosterCharacter(
      "source",
      "fixture-dwarf",
      1,
      4,
      7,
      7,
    );
    const campRoster: CampRoster = [
      targetCharacter,
      null,
      null,
      sourceCharacter,
      null,
      null,
      null,
    ];

    const result = mergeRosterCharacters(campRoster, 3, 0);

    const expectedCampRoster: CampRoster = [
      {
        ...targetCharacter,
        experience: 4,
        attack: 8,
        hp: 9,
        maxHp: 11,
      },
      null,
      null,
      null,
      null,
      null,
      null,
    ];

    expect(result).toEqual({
      outcome: "accepted",
      nextCampRoster: expectedCampRoster,
    });
  });

  it("RM2: a max-level source can be merged in; the gain caps at 15", () => {
    const targetCharacter = buildRosterCharacter(
      "target",
      "fixture-dwarf",
      14,
      4,
      7,
      7,
    );
    const sourceCharacter = buildRosterCharacter(
      "source",
      "fixture-dwarf",
      15,
      4,
      7,
      7,
    );
    const campRoster: CampRoster = [
      null,
      targetCharacter,
      sourceCharacter,
      null,
      null,
      null,
      null,
    ];

    const result = mergeRosterCharacters(campRoster, 2, 1);

    const expectedCampRoster: CampRoster = [
      null,
      {
        ...targetCharacter,
        experience: 15,
        attack: 5,
        hp: 8,
        maxHp: 8,
      },
      null,
      null,
      null,
      null,
      null,
    ];

    expect(result).toEqual({
      outcome: "accepted",
      nextCampRoster: expectedCampRoster,
    });
  });

  it("RM3: each rejection reason", () => {
    const campRoster: CampRoster = [
      buildRosterCharacter("a", "fixture-dwarf", 0, 1, 1, 1),
      buildRosterCharacter("b", "fixture-dwarf", 0, 1, 1, 1),
      buildRosterCharacter("c", "other-dwarf", 0, 1, 1, 1),
      buildRosterCharacter("d", "fixture-dwarf", 15, 1, 1, 1),
      null,
      null,
      null,
    ];

    function rejectionReasonOf(fromSlotIndex: number, intoSlotIndex: number) {
      const result = mergeRosterCharacters(
        campRoster,
        fromSlotIndex,
        intoSlotIndex,
      );
      return result.outcome === "rejected" ? result.rejectionReason : null;
    }

    expect(rejectionReasonOf(7, 0)).toBe("invalidSlot");
    expect(rejectionReasonOf(0, 0)).toBe("sameSlot");
    expect(rejectionReasonOf(5, 0)).toBe("sourceSlotEmpty");
    expect(rejectionReasonOf(0, 5)).toBe("targetSlotEmpty");
    expect(rejectionReasonOf(0, 2)).toBe("charactersDoNotMatch");
    expect(rejectionReasonOf(0, 3)).toBe("targetSlotAtMaxLevel");
  });

  it("RM4: checks in order", () => {
    const campRoster: CampRoster = [
      buildRosterCharacter("a", "fixture-dwarf", 0, 1, 1, 1),
      buildRosterCharacter("b", "fixture-dwarf", 0, 1, 1, 1),
      buildRosterCharacter("c", "other-dwarf", 0, 1, 1, 1),
      buildRosterCharacter("d", "fixture-dwarf", 15, 1, 1, 1),
      null,
      null,
      null,
    ];

    function rejectionReasonOf(fromSlotIndex: number, intoSlotIndex: number) {
      const result = mergeRosterCharacters(
        campRoster,
        fromSlotIndex,
        intoSlotIndex,
      );
      return result.outcome === "rejected" ? result.rejectionReason : null;
    }

    expect(rejectionReasonOf(7, 7)).toBe("invalidSlot");
    expect(rejectionReasonOf(5, 6)).toBe("sourceSlotEmpty");
    expect(rejectionReasonOf(2, 3)).toBe("charactersDoNotMatch");
  });

  it("RM5: does not mutate the input roster", () => {
    const targetCharacter = buildRosterCharacter(
      "target",
      "fixture-dwarf",
      2,
      6,
      7,
      9,
    );
    const sourceCharacter = buildRosterCharacter(
      "source",
      "fixture-dwarf",
      1,
      4,
      7,
      7,
    );
    const campRoster: CampRoster = [
      targetCharacter,
      null,
      null,
      sourceCharacter,
      null,
      null,
      null,
    ];
    const campRosterClone = structuredClone(campRoster);

    mergeRosterCharacters(campRoster, 3, 0);

    expect(campRoster).toEqual(campRosterClone);
  });
});
