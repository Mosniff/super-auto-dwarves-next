import { describe, it, expect } from "vitest";
import {
  buildTestCharacter,
  buildTestCharacterTemplate,
} from "@/test/characterFixtures";
import { CHARACTER_ABILITIES } from "./characterAbilities";
import { findCharacterAbilityForCharacter } from "./characterAbilityLookup";

describe("characterAbilityLookup", () => {
  it("AL1: finds the ability named by the character's template (injected lookup)", () => {
    const fixtureTemplate = buildTestCharacterTemplate({
      characterTemplateId: "fixture-straps",
      abilityId: "tighten-those-straps-son",
    });
    const lookup = (characterTemplateId: string) =>
      characterTemplateId === "fixture-straps" ? fixtureTemplate : undefined;

    expect(
      findCharacterAbilityForCharacter(
        buildTestCharacter({
          id: "c1",
          name: "Fixture Dwarf",
          characterTemplateId: "fixture-straps",
        }),
        lookup,
      ),
    ).toBe(CHARACTER_ABILITIES["tighten-those-straps-son"]);
  });

  it("AL2: returns undefined when the template can't be found", () => {
    const fixtureTemplate = buildTestCharacterTemplate({
      characterTemplateId: "fixture-straps",
      abilityId: "tighten-those-straps-son",
    });
    const lookup = (characterTemplateId: string) =>
      characterTemplateId === "fixture-straps" ? fixtureTemplate : undefined;

    expect(
      findCharacterAbilityForCharacter(
        buildTestCharacter({
          id: "c1",
          name: "Fixture Dwarf",
          characterTemplateId: "missing-template",
        }),
        lookup,
      ),
    ).toBeUndefined();
  });

  it("AL3: uses the real templates by default (Borin has Growing Lad)", () => {
    expect(
      findCharacterAbilityForCharacter(
        buildTestCharacter({
          id: "c1",
          name: "Borin",
          characterTemplateId: "borin",
        }),
      ),
    ).toBe(CHARACTER_ABILITIES["growing-lad"]);
  });
});
