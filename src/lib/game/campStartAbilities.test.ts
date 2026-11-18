import { describe, it, expect } from "vitest";
import { buildTestCharacter } from "@/test/characterFixtures";
import type { CampRoster } from "./campRoster";
import { campStartActivations } from "./campStartAbilities";

const fixturePennyPincher = {
  abilityId: "penny-pincher",
  trigger: "onCampStart",
  goldByLevel: [2, 3, 5, 7, 11],
} as const;

function findFixturePennyPincher(character: { characterTemplateId: string }) {
  return character.characterTemplateId === "fixture-pincher"
    ? fixturePennyPincher
    : undefined;
}

describe("campStartActivations", () => {
  it("CA1: fires every onCampStart dwarf front to back, with gold from its data at its level", () => {
    const campRoster: CampRoster = [
      buildTestCharacter({
        id: "pincher-a",
        name: "Norbin",
        characterTemplateId: "fixture-pincher",
        experience: 0,
      }),
      null,
      buildTestCharacter({ id: "plain", name: "Borin" }),
      buildTestCharacter({
        id: "pincher-b",
        name: "Norbin",
        characterTemplateId: "fixture-pincher",
        experience: 3,
      }),
      null,
      null,
      null,
    ];

    expect(
      campStartActivations(campRoster, findFixturePennyPincher),
    ).toEqual([
      {
        characterId: "pincher-a",
        slotIndex: 0,
        abilityId: "penny-pincher",
        goldGained: 2,
      },
      {
        characterId: "pincher-b",
        slotIndex: 3,
        abilityId: "penny-pincher",
        goldGained: 3,
      },
    ]);
  });

  it("CA2: an empty roster fires nothing", () => {
    const campRoster: CampRoster = [null, null, null, null, null, null, null];

    expect(
      campStartActivations(campRoster, findFixturePennyPincher),
    ).toEqual([]);
  });

  it("CA3: the real Norbin gains 1 gold at level 1 through the default lookup", () => {
    const campRoster: CampRoster = [
      buildTestCharacter({
        id: "real-norbin",
        name: "Norbin",
        characterTemplateId: "norbin",
        experience: 0,
      }),
      null,
      null,
      null,
      null,
      null,
      null,
    ];

    expect(campStartActivations(campRoster)).toEqual([
      {
        characterId: "real-norbin",
        slotIndex: 0,
        abilityId: "penny-pincher",
        goldGained: 1,
      },
    ]);
  });
});
