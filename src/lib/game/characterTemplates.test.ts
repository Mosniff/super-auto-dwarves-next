import { describe, it, expect } from "vitest";
import { isCharacterClassId } from "./characterClasses";
import { isCharacterTier } from "./characterTiers";
import { isCharacterFactionId } from "./characterFactions";
import { CHARACTER_ABILITY_IDS } from "./characterAbilities";
import {
  CHARACTER_TEMPLATES,
  findCharacterTemplate,
  listCharacterTemplates,
  listPlayerShopCharacterTemplates,
} from "./characterTemplates";

const TEMPLATE_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("characterTemplates", () => {
  // deliberate assertion rewrite: expected value gains characterFactionId "dwarf" (before: no characterFactionId; after: characterFactionId: "dwarf") — Phase 13 factions
  it("P1: findCharacterTemplate returns the borin template", () => {
    expect(findCharacterTemplate("borin")).toEqual({
      characterTemplateId: "borin",
      name: "Borin",
      tier: 1,
      characterFactionId: "dwarf",
      characterClassIds: ["warrior"],
      attack: 4,
      maxHp: 7,
      armour: 0,
      abilityId: "growing-lad",
    });
  });

  it("P2: findCharacterTemplate returns undefined for an unknown id", () => {
    expect(findCharacterTemplate("unknown-dwarf")).toBeUndefined();
  });

  // deliberate assertion rewrite: the two kobold templates join the list (before: ["borin", "ogden", "norbin"]; after: ["borin", "ogden", "norbin", "kobold-runt", "kobold-thief"]) — Phase 13
  it("P3: listCharacterTemplates lists every template id", () => {
    expect(
      listCharacterTemplates().map(
        (characterTemplate) => characterTemplate.characterTemplateId,
      ),
    ).toEqual(["borin", "ogden", "norbin", "kobold-runt", "kobold-thief"]);
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

  it("P13: every template has a valid faction", () => {
    expect(
      Object.values(CHARACTER_TEMPLATES)
        .filter(
          (characterTemplate) =>
            !isCharacterFactionId(characterTemplate.characterFactionId),
        )
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

  it("P9: every template has a non-negative integer armour", () => {
    expect(
      Object.values(CHARACTER_TEMPLATES)
        .filter(
          (characterTemplate) =>
            !Number.isInteger(characterTemplate.armour) ||
            characterTemplate.armour < 0,
        )
        .map((characterTemplate) => characterTemplate.characterTemplateId),
    ).toEqual([]);
  });

  // deliberate assertion rewrite: expected value gains characterFactionId "dwarf" (before: no characterFactionId; after: characterFactionId: "dwarf") — Phase 13 factions
  it("P10: findCharacterTemplate returns the ogden template", () => {
    expect(findCharacterTemplate("ogden")).toEqual({
      characterTemplateId: "ogden",
      name: "Ogden",
      tier: 1,
      characterFactionId: "dwarf",
      characterClassIds: ["warrior"],
      attack: 3,
      maxHp: 8,
      armour: 0,
      abilityId: "tighten-those-straps-son",
    });
  });

  it("P11: every template's abilityId is a known ability id", () => {
    expect(
      Object.values(CHARACTER_TEMPLATES)
        .filter(
          (characterTemplate) =>
            !(CHARACTER_ABILITY_IDS as readonly string[]).includes(
              characterTemplate.abilityId,
            ),
        )
        .map((characterTemplate) => characterTemplate.characterTemplateId),
    ).toEqual([]);
  });

  // deliberate assertion rewrite: expected value gains characterFactionId "dwarf" (before: no characterFactionId; after: characterFactionId: "dwarf") — Phase 13 factions
  it("P12: findCharacterTemplate returns the norbin template", () => {
    expect(findCharacterTemplate("norbin")).toEqual({
      characterTemplateId: "norbin",
      name: "Norbin",
      tier: 1,
      characterFactionId: "dwarf",
      characterClassIds: ["merchant"],
      attack: 1,
      maxHp: 3,
      armour: 0,
      abilityId: "penny-pincher",
    });
  });

  it("P14: the player's shop lists exactly the dwarf templates", () => {
    expect(
      listPlayerShopCharacterTemplates().map(
        (characterTemplate) => characterTemplate.characterTemplateId,
      ),
    ).toEqual(["borin", "ogden", "norbin"]);
  });

  it("P15: findCharacterTemplate returns the kobold-runt template", () => {
    expect(findCharacterTemplate("kobold-runt")).toEqual({
      characterTemplateId: "kobold-runt",
      name: "Kobold Runt",
      tier: 1,
      characterFactionId: "kobold",
      characterClassIds: ["warrior"],
      attack: 1,
      maxHp: 3,
      armour: 0,
      abilityId: "yip",
    });
  });

  it("P16: findCharacterTemplate returns the kobold-thief template", () => {
    expect(findCharacterTemplate("kobold-thief")).toEqual({
      characterTemplateId: "kobold-thief",
      name: "Kobold Thief",
      tier: 1,
      characterFactionId: "kobold",
      characterClassIds: ["warrior"],
      attack: 2,
      maxHp: 3,
      armour: 0,
      abilityId: "yip-strike",
    });
  });
});
