import { describe, it, expect } from "vitest";
import { isCharacterClassId } from "./characterClasses";
import { isCharacterTier } from "./characterTiers";
import {
  CHARACTER_TEMPLATES,
  findCharacterTemplate,
  listCharacterTemplates,
} from "./characterTemplates";

const TEMPLATE_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("characterTemplates", () => {
  it("P1: findCharacterTemplate returns the borin template", () => {
    expect(findCharacterTemplate("borin")).toEqual({
      characterTemplateId: "borin",
      name: "Borin",
      tier: 1,
      characterClassIds: ["warrior"],
      attack: 4,
      maxHp: 7,
    });
  });

  it("P2: findCharacterTemplate returns undefined for an unknown id", () => {
    expect(findCharacterTemplate("unknown-dwarf")).toBeUndefined();
  });

  it("P3: listCharacterTemplates lists every template id", () => {
    expect(
      listCharacterTemplates().map(
        (characterTemplate) => characterTemplate.characterTemplateId,
      ),
    ).toEqual(["borin"]);
  });

  // P4-P8 are guards over hand-written template data, not behaviour under
  // test; they pass trivially while CHARACTER_TEMPLATES is empty.

  it("P4: every template is keyed by its own characterTemplateId", () => {
    expect(
      Object.entries(CHARACTER_TEMPLATES)
        .filter(
          ([templateKey, characterTemplate]) =>
            templateKey !== characterTemplate.characterTemplateId,
        )
        .map(([templateKey]) => templateKey),
    ).toEqual([]);
  });

  it("P5: every template id is lowercase kebab-case", () => {
    expect(
      Object.keys(CHARACTER_TEMPLATES).filter(
        (characterTemplateId) =>
          !TEMPLATE_ID_PATTERN.test(characterTemplateId),
      ),
    ).toEqual([]);
  });

  it("P6: every template has a valid tier", () => {
    expect(
      Object.values(CHARACTER_TEMPLATES)
        .filter((characterTemplate) => !isCharacterTier(characterTemplate.tier))
        .map((characterTemplate) => characterTemplate.characterTemplateId),
    ).toEqual([]);
  });

  it("P7: every template has 1-3 distinct, valid class ids", () => {
    function hasInvalidClassIds(characterClassIds: readonly unknown[]): boolean {
      if (characterClassIds.length < 1 || characterClassIds.length > 3) {
        return true;
      }
      if (characterClassIds.some((classId) => !isCharacterClassId(classId))) {
        return true;
      }
      return new Set(characterClassIds).size !== characterClassIds.length;
    }

    expect(
      Object.values(CHARACTER_TEMPLATES)
        .filter((characterTemplate) =>
          hasInvalidClassIds(characterTemplate.characterClassIds),
        )
        .map((characterTemplate) => characterTemplate.characterTemplateId),
    ).toEqual([]);
  });

  it("P8: every template has a non-negative integer attack and a positive integer maxHp", () => {
    expect(
      Object.values(CHARACTER_TEMPLATES)
        .filter(
          (characterTemplate) =>
            !Number.isInteger(characterTemplate.attack) ||
            characterTemplate.attack < 0 ||
            !Number.isInteger(characterTemplate.maxHp) ||
            characterTemplate.maxHp <= 0,
        )
        .map((characterTemplate) => characterTemplate.characterTemplateId),
    ).toEqual([]);
  });
});
