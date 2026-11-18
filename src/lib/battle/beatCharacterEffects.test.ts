import { describe, it, expect } from "vitest";
import { beatCharacterEffects } from "./beatCharacterEffects";
import type { BattleEvent } from "./types";

describe("beatCharacterEffects", () => {
  it("BE1: an ability beat: the caster is acting, the target gained armour", () => {
    const beatEvents: BattleEvent[] = [
      {
        type: "ABILITY_ACTIVATE",
        characterId: "p2",
        abilityId: "tighten-those-straps-son",
        beatIndex: 1,
        beatType: "ABILITY",
      },
      {
        type: "STAT_CHANGE",
        targetId: "p1",
        stat: "armour",
        amount: 1,
        resultingValue: 1,
        source: "p2",
        sourceAbilityId: "tighten-those-straps-son",
        beatIndex: 1,
        beatType: "ABILITY",
      },
    ];

    expect(beatCharacterEffects(beatEvents)).toEqual({
      p2: { isActing: true, armourGained: 0, brokenFromArmour: null },
      p1: { isActing: false, armourGained: 1, brokenFromArmour: null },
    });
  });

  it("BE2: a level-5 Ogden is both acting and receiving", () => {
    const beatEvents: BattleEvent[] = [
      {
        type: "ABILITY_ACTIVATE",
        characterId: "p2",
        abilityId: "tighten-those-straps-son",
        beatIndex: 1,
        beatType: "ABILITY",
      },
      {
        type: "STAT_CHANGE",
        targetId: "p1",
        stat: "armour",
        amount: 1,
        resultingValue: 1,
        source: "p2",
        sourceAbilityId: "tighten-those-straps-son",
        beatIndex: 1,
        beatType: "ABILITY",
      },
      {
        type: "STAT_CHANGE",
        targetId: "p2",
        stat: "armour",
        amount: 1,
        resultingValue: 1,
        source: "p2",
        sourceAbilityId: "tighten-those-straps-son",
        beatIndex: 1,
        beatType: "ABILITY",
      },
      {
        type: "STAT_CHANGE",
        targetId: "p3",
        stat: "armour",
        amount: 1,
        resultingValue: 1,
        source: "p2",
        sourceAbilityId: "tighten-those-straps-son",
        beatIndex: 1,
        beatType: "ABILITY",
      },
    ];

    expect(beatCharacterEffects(beatEvents)).toEqual({
      p2: { isActing: true, armourGained: 1, brokenFromArmour: null },
      p1: { isActing: false, armourGained: 1, brokenFromArmour: null },
      p3: { isActing: false, armourGained: 1, brokenFromArmour: null },
    });
  });

  it("BE3: a clash beat: only a break counts; a partial absorb and hp damage don't", () => {
    const beatEvents: BattleEvent[] = [
      {
        type: "ATTACK",
        attackerId: "p1",
        targetId: "e1",
        value: 5,
        beatIndex: 2,
        beatType: "CLASH",
      },
      {
        type: "ATTACK",
        attackerId: "e1",
        targetId: "p1",
        value: 1,
        beatIndex: 2,
        beatType: "CLASH",
      },
      {
        type: "ARMOUR_DAMAGE",
        targetId: "e1",
        amount: 2,
        resultingArmour: 0,
        source: "p1",
        beatIndex: 2,
        beatType: "CLASH",
      },
      {
        type: "ARMOUR_DAMAGE",
        targetId: "p1",
        amount: 1,
        resultingArmour: 2,
        source: "e1",
        beatIndex: 2,
        beatType: "CLASH",
      },
    ];

    expect(beatCharacterEffects(beatEvents)).toEqual({
      e1: { isActing: false, armourGained: 0, brokenFromArmour: 2 },
    });
  });

  it("BE4: two armour gains in one beat add up", () => {
    const beatEvents: BattleEvent[] = [
      {
        type: "ABILITY_ACTIVATE",
        characterId: "p3",
        abilityId: "tighten-those-straps-son",
        beatIndex: 1,
        beatType: "ABILITY",
      },
      {
        type: "STAT_CHANGE",
        targetId: "p1",
        stat: "armour",
        amount: 1,
        resultingValue: 1,
        source: "p3",
        sourceAbilityId: "tighten-those-straps-son",
        beatIndex: 1,
        beatType: "ABILITY",
      },
      {
        type: "STAT_CHANGE",
        targetId: "p1",
        stat: "armour",
        amount: 1,
        resultingValue: 2,
        source: "p3",
        sourceAbilityId: "tighten-those-straps-son",
        beatIndex: 1,
        beatType: "ABILITY",
      },
    ];

    expect(beatCharacterEffects(beatEvents)).toEqual({
      p3: { isActing: true, armourGained: 0, brokenFromArmour: null },
      p1: { isActing: false, armourGained: 2, brokenFromArmour: null },
    });
  });

  it("BE5: an empty beat affects no one", () => {
    expect(beatCharacterEffects([])).toEqual({});
  });
});
