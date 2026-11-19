import { describe, it, expect } from "vitest";
import {
  CHARACTER_ABILITIES,
  CHARACTER_ABILITY_IDS,
  findCharacterAbility,
} from "./characterAbilities";

describe("characterAbilities", () => {
  // deliberate assertion rewrite: the two kobold abilities join the list (before: growing-lad, tighten-those-straps-son, penny-pincher; after: those plus yip, yip-strike) — Phase 13
  it("AB1: every ability is keyed by its own abilityId, in CHARACTER_ABILITY_IDS order", () => {
    expect(
      Object.entries(CHARACTER_ABILITIES).map(([abilityKey, ability]) => [
        abilityKey,
        ability.abilityId,
      ]),
    ).toEqual([
      ["growing-lad", "growing-lad"],
      ["tighten-those-straps-son", "tighten-those-straps-son"],
      ["penny-pincher", "penny-pincher"],
      ["yip", "yip"],
      ["yip-strike", "yip-strike"],
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

  it("AB5: Penny Pincher is the human's design", () => {
    expect(CHARACTER_ABILITIES["penny-pincher"]).toEqual({
      abilityId: "penny-pincher",
      trigger: "onCampStart",
      goldByLevel: [1, 2, 3, 4, 5],
    });
  });

  it("AB6: Yip! is the human's design: a turn-start ability with no data", () => {
    expect(CHARACTER_ABILITIES.yip).toEqual({
      abilityId: "yip",
      trigger: "onTurnStart",
    });
  });

  it("AB7: Yip Strike is the human's design: level N makes N hits of 1 damage at battle start", () => {
    expect(CHARACTER_ABILITIES["yip-strike"]).toEqual({
      abilityId: "yip-strike",
      trigger: "onBattleStartDamage",
      hitCountByLevel: [1, 2, 3, 4, 5],
      damagePerHitByLevel: [1, 1, 1, 1, 1],
    });
  });
});
