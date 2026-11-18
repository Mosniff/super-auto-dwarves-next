import { describe, it, expect } from "vitest";
import { buildTestCharacter, buildTestCharacterTemplate } from "./characterFixtures";

describe("characterFixtures", () => {
  // deliberate assertion rewrite: expected value gains characterFactionId "dwarf" (before: no characterFactionId; after: characterFactionId: "dwarf") — Phase 13 factions
  it("B1: buildTestCharacter returns the documented defaults", () => {
    expect(buildTestCharacter()).toEqual({
      id: "fixture-character",
      characterTemplateId: "fixture-dwarf",
      name: "Fixture Dwarf",
      tier: 1,
      characterFactionId: "dwarf",
      characterClassIds: ["warrior"],
      attack: 4,
      hp: 7,
      maxHp: 7,
      armour: 0,
      experience: 0,
    });
  });

  // deliberate assertion rewrite: expected value gains characterFactionId "dwarf" (before: no characterFactionId; after: characterFactionId: "dwarf") — Phase 13 factions
  it("B2: buildTestCharacter applies overrides and keeps the other defaults", () => {
    expect(
      buildTestCharacter({ id: "p1", name: "Borin", attack: 5, armour: 2, experience: 3 }),
    ).toEqual({
      id: "p1",
      characterTemplateId: "fixture-dwarf",
      name: "Borin",
      tier: 1,
      characterFactionId: "dwarf",
      characterClassIds: ["warrior"],
      attack: 5,
      hp: 7,
      maxHp: 7,
      armour: 2,
      experience: 3,
    });
  });

  it("B3: hp follows a maxHp override unless hp is given", () => {
    expect(
      [{ maxHp: 12 }, { maxHp: 12, hp: 3 }]
        .map((overrides) => buildTestCharacter(overrides))
        .map((character) => [character.hp, character.maxHp]),
    ).toEqual([
      [12, 12],
      [3, 12],
    ]);
  });

  it("B4: each built character and template gets its own classes array", () => {
    const firstCharacter = buildTestCharacter();
    const secondCharacter = buildTestCharacter();
    const firstTemplate = buildTestCharacterTemplate();
    const secondTemplate = buildTestCharacterTemplate();

    expect([
      firstCharacter.characterClassIds !== secondCharacter.characterClassIds &&
        Array.isArray(firstCharacter.characterClassIds),
      firstTemplate.characterClassIds !== secondTemplate.characterClassIds &&
        Array.isArray(firstTemplate.characterClassIds),
    ]).toEqual([true, true]);
  });

  // deliberate assertion rewrite: expected value gains characterFactionId "dwarf" (before: no characterFactionId; after: characterFactionId: "dwarf") — Phase 13 factions
  it("T1: buildTestCharacterTemplate returns the documented defaults", () => {
    expect(buildTestCharacterTemplate()).toEqual({
      characterTemplateId: "fixture-dwarf",
      name: "Fixture Dwarf",
      tier: 1,
      characterFactionId: "dwarf",
      characterClassIds: ["warrior"],
      attack: 4,
      maxHp: 7,
      armour: 0,
      abilityId: "growing-lad",
    });
  });

  // deliberate assertion rewrite: expected value gains characterFactionId "dwarf" (before: no characterFactionId; after: characterFactionId: "dwarf") — Phase 13 factions
  it("T2: buildTestCharacterTemplate applies overrides and keeps the other defaults", () => {
    expect(
      buildTestCharacterTemplate({
        characterTemplateId: "fixture-dwarf-two",
        tier: 2,
        characterClassIds: ["smith", "miner"],
        maxHp: 8,
      }),
    ).toEqual({
      characterTemplateId: "fixture-dwarf-two",
      name: "Fixture Dwarf",
      tier: 2,
      characterFactionId: "dwarf",
      characterClassIds: ["smith", "miner"],
      attack: 4,
      maxHp: 8,
      armour: 0,
      abilityId: "growing-lad",
    });
  });
});
