import { describe, it, expect } from "vitest";
import {
  CHARACTER_ABILITIES,
  CHARACTER_ABILITY_IDS,
  findCharacterAbility,
} from "./characterAbilities";

describe("characterAbilities", () => {
  it("AB1: every ability is keyed by its own abilityId, in CHARACTER_ABILITY_IDS order", () => {
    expect(
      Object.entries(CHARACTER_ABILITIES).map(([abilityKey, ability]) => [
        abilityKey,
        ability.abilityId,
      ]),
    ).toEqual([
      ["growing-lad", "growing-lad"],
      ["tighten-those-straps-son", "tighten-those-straps-son"],
    ]);
  });

  it("AB2: Growing Lad is the human's design", () => {
    expect(CHARACTER_ABILITIES["growing-lad"]).toEqual({
      abilityId: "growing-lad",
      trigger: "onExperienceGain",
      extraHpPerExperiencePointByLevel: [1, 2, 3, 4, 5],
    });
  });

  it("AB3: Tighten Those Straps Son is the human's design", () => {
    expect(CHARACTER_ABILITIES["tighten-those-straps-son"]).toEqual({
      abilityId: "tighten-those-straps-son",
      trigger: "onBattleStartBuffs",
      armourGrantedByLevel: [1, 1, 1, 1, 1],
      targetingByLevel: [
        { kind: "alliesAhead", count: 1 },
        { kind: "alliesAhead", count: 2 },
        { kind: "alliesAhead", count: 3 },
        { kind: "alliesAhead", count: 4 },
        { kind: "wholeParty" },
      ],
    });
  });

  it("AB4: findCharacterAbility finds every ability by its id", () => {
    expect(
      CHARACTER_ABILITY_IDS.map(
        (abilityId) => findCharacterAbility(abilityId)?.abilityId,
      ),
    ).toEqual([...CHARACTER_ABILITY_IDS]);
  });
});
