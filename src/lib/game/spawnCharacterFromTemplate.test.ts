import { describe, it, expect } from "vitest";
import type { CharacterTemplate } from "./characterTemplates";
import { spawnCharacterFromTemplate } from "./spawnCharacterFromTemplate";

const fixtureTemplate: CharacterTemplate = {
  characterTemplateId: "fixture-dwarf",
  name: "Fixture Dwarf",
  tier: 2,
  characterClassIds: ["smith", "miner"],
  attack: 3,
  maxHp: 9,
};

describe("spawnCharacterFromTemplate", () => {
  it("S1: builds an owned character from a template with a fresh id and hp at maxHp", () => {
    const spawnedCharacter = spawnCharacterFromTemplate(
      fixtureTemplate,
      "new-character-1",
    );

    expect(spawnedCharacter).toEqual({
      id: "new-character-1",
      characterTemplateId: "fixture-dwarf",
      name: "Fixture Dwarf",
      tier: 2,
      characterClassIds: ["smith", "miner"],
      attack: 3,
      hp: 9,
      maxHp: 9,
    });
  });

  it("S2: the spawned character's characterClassIds is a copy, not the template's own array", () => {
    const spawnedCharacter = spawnCharacterFromTemplate(
      fixtureTemplate,
      "new-character-1",
    );

    expect(spawnedCharacter.characterClassIds).not.toBe(
      fixtureTemplate.characterClassIds,
    );
  });
});
