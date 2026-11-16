import { describe, it, expect } from "vitest";
import type { Character } from "@/lib/game/character";
import type { CampState } from "./campState";
import { buildFixtureCharacterShopSlots } from "@/test/characterShopFixtures";
import { sellCharacter, sellCharacterRejectionReason } from "./sellCharacter";

function buildRosterCharacter(id: string): Character {
  return {
    id,
    name: "Dwarf " + id,
    characterTemplateId: "fixture-dwarf",
    tier: 1,
    characterClassIds: ["warrior"],
    attack: 2,
    hp: 5,
    maxHp: 5,
    armour: 0,
    experience: 0,
  };
}

describe("sellCharacter", () => {
  it("(SC1) sells a dwarf: the slot empties and gold rises by the sell price", () => {
    const campState: CampState = {
      campRoster: [
        buildRosterCharacter("a"),
        null,
        buildRosterCharacter("c"),
        null,
        null,
        null,
        null,
      ],
      gold: 4,
      characterShopSlots: buildFixtureCharacterShopSlots(),
    };

    const result = sellCharacter(campState, 2);

    expect(result).toEqual({
      outcome: "accepted",
      nextCampState: {
        campRoster: [
          buildRosterCharacter("a"),
          null,
          null,
          null,
          null,
          null,
          null,
        ],
        gold: 5,
        characterShopSlots: buildFixtureCharacterShopSlots(),
      },
    });
  });

  it("(SC2) rejection reasons", () => {
    const campRoster = [
      buildRosterCharacter("a"),
      null,
      buildRosterCharacter("c"),
      null,
      null,
      null,
      null,
    ];

    function rejectionReasonOf(slotIndex: number) {
      return sellCharacterRejectionReason(campRoster, slotIndex);
    }

    expect([7, 3].map((slotIndex) => rejectionReasonOf(slotIndex))).toEqual([
      "invalidSlot",
      "slotEmpty",
    ]);
  });

  it("(SC3) selling the last dwarf is allowed", () => {
    const campState: CampState = {
      campRoster: [
        buildRosterCharacter("a"),
        null,
        null,
        null,
        null,
        null,
        null,
      ],
      gold: 0,
      characterShopSlots: buildFixtureCharacterShopSlots(),
    };

    const result = sellCharacter(campState, 0);

    expect(result).toEqual({
      outcome: "accepted",
      nextCampState: {
        campRoster: [null, null, null, null, null, null, null],
        gold: 1,
        characterShopSlots: buildFixtureCharacterShopSlots(),
      },
    });
  });

  it("(SC4) does not mutate the input state", () => {
    const campState: CampState = {
      campRoster: [
        buildRosterCharacter("a"),
        null,
        buildRosterCharacter("c"),
        null,
        null,
        null,
        null,
      ],
      gold: 4,
      characterShopSlots: buildFixtureCharacterShopSlots(),
    };
    const campStateClone = structuredClone(campState);

    sellCharacter(campState, 2);

    expect(campState).toEqual(campStateClone);
  });
});
