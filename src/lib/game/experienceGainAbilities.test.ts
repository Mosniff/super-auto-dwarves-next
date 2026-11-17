import { describe, it, expect } from "vitest";
import { buildTestCharacter } from "@/test/characterFixtures";
import type { CharacterLevel } from "./characterExperience";
import {
  applyExperienceGainAbility,
  type ExperienceGainAbility,
} from "./experienceGainAbilities";

describe("experienceGainAbilities", () => {
  it("XA1: Growing Lad adds its extra hp for the given level to max hp and current hp only", () => {
    const fixtureAbility: ExperienceGainAbility = {
      abilityId: "growing-lad",
      trigger: "onExperienceGain",
      extraHpPerExperiencePointByLevel: [2, 3, 5, 7, 11],
    };
    const character = buildTestCharacter({
      id: "x1",
      name: "Fixture Dwarf",
      attack: 4,
      hp: 5,
      maxHp: 8,
    });

    expect(
      ([1, 2, 3, 4, 5] as const).map((levelBeforePoint: CharacterLevel) => {
        const result = applyExperienceGainAbility(
          fixtureAbility,
          character,
          levelBeforePoint,
        );
        return [result.attack, result.hp, result.maxHp];
      }),
    ).toEqual([
      [4, 7, 10],
      [4, 8, 11],
      [4, 10, 13],
      [4, 12, 15],
      [4, 16, 19],
    ]);
  });
});
