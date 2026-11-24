import { describe, it, expect } from "vitest";
import { beatCharacterEffects } from "./beatCharacterEffects";
import type { BattleEvent } from "./types";

describe("beatCharacterEffects", () => {
  // deliberate assertion rewrite: every effect gains abilityHpLost: 0 and isDropped: false (before: { isActing, armourGained, brokenFromArmour }; after: + abilityHpLost: 0, isDropped: false) — Phase 13
  // deliberate assertion rewrite: every effect gains armourLost (before: no armourLost; after: armourLost: 0 — no armour was hit in this beat) — Phase 15
  // deliberate assertion rewrite: every effect gains dealsAbilityHit (before: no dealsAbilityHit; after: dealsAbilityHit: false — no acting caster's ability hit anyone in this beat) — Phase 15
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
      p2: { isActing: true, armourGained: 0, brokenFromArmour: null, abilityHpLost: 0, armourLost: 0, dealsAbilityHit: false, isDropped: false },
      p1: { isActing: false, armourGained: 1, brokenFromArmour: null, abilityHpLost: 0, armourLost: 0, dealsAbilityHit: false, isDropped: false },
    });
  });

  // deliberate assertion rewrite: every effect gains abilityHpLost: 0 and isDropped: false (before: { isActing, armourGained, brokenFromArmour }; after: + abilityHpLost: 0, armourLost: 0, dealsAbilityHit: false, isDropped: false) — Phase 13
  // deliberate assertion rewrite: every effect gains armourLost (before: no armourLost; after: armourLost: 0 — no armour was hit in this beat) — Phase 15
  // deliberate assertion rewrite: every effect gains dealsAbilityHit (before: no dealsAbilityHit; after: dealsAbilityHit: false — no acting caster's ability hit anyone in this beat) — Phase 15
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
      p2: { isActing: true, armourGained: 1, brokenFromArmour: null, abilityHpLost: 0, armourLost: 0, dealsAbilityHit: false, isDropped: false },
      p1: { isActing: false, armourGained: 1, brokenFromArmour: null, abilityHpLost: 0, armourLost: 0, dealsAbilityHit: false, isDropped: false },
      p3: { isActing: false, armourGained: 1, brokenFromArmour: null, abilityHpLost: 0, armourLost: 0, dealsAbilityHit: false, isDropped: false },
    });
  });

  // deliberate assertion rewrite: every effect gains abilityHpLost: 0 and isDropped: false (before: { isActing, armourGained, brokenFromArmour }; after: + abilityHpLost: 0, armourLost: 0, dealsAbilityHit: false, isDropped: false) — Phase 13
  // deliberate assertion rewrite: a partial absorb now counts (before: only e1's break appeared and p1's partial absorb was ignored; after: both appear, with armourLost 2 and 1) — Phase 15
  // deliberate assertion rewrite: every effect gains dealsAbilityHit (before: no dealsAbilityHit; after: dealsAbilityHit: false — no acting caster's ability hit anyone in this beat) — Phase 15
  it("BE3: a clash beat: a break and a partial absorb both count as armourLost; only the break sets brokenFromArmour", () => {
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
      e1: { isActing: false, armourGained: 0, brokenFromArmour: 2, abilityHpLost: 0, armourLost: 2, dealsAbilityHit: false, isDropped: false },
      p1: { isActing: false, armourGained: 0, brokenFromArmour: null, abilityHpLost: 0, armourLost: 1, dealsAbilityHit: false, isDropped: false },
    });
  });

  // deliberate assertion rewrite: every effect gains abilityHpLost: 0 and isDropped: false (before: { isActing, armourGained, brokenFromArmour }; after: + abilityHpLost: 0, isDropped: false) — Phase 13
  // deliberate assertion rewrite: every effect gains armourLost (before: no armourLost; after: armourLost: 0 — no armour was hit in this beat) — Phase 15
  // deliberate assertion rewrite: every effect gains dealsAbilityHit (before: no dealsAbilityHit; after: dealsAbilityHit: false — no acting caster's ability hit anyone in this beat) — Phase 15
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
      p3: { isActing: true, armourGained: 0, brokenFromArmour: null, abilityHpLost: 0, armourLost: 0, dealsAbilityHit: false, isDropped: false },
      p1: { isActing: false, armourGained: 2, brokenFromArmour: null, abilityHpLost: 0, armourLost: 0, dealsAbilityHit: false, isDropped: false },
    });
  });

  it("BE5: an empty beat affects no one", () => {
    expect(beatCharacterEffects([])).toEqual({});
  });

  // deliberate assertion rewrite: every effect gains armourLost (before: no armourLost; after: armourLost: 0 — no armour was hit in this beat) — Phase 15
  // deliberate assertion rewrite: every effect gains dealsAbilityHit (before: no dealsAbilityHit; after: dealsAbilityHit: false — no acting caster's ability hit anyone in this beat) — Phase 15
  it("BE6: ability hits add up as abilityHpLost, a clash hit doesn't count, and a drop marks isDropped", () => {
    const beatEvents: BattleEvent[] = [
      {
        type: "DAMAGE",
        targetId: "p1",
        amount: 1,
        resultingHp: 4,
        source: "thief",
        sourceAbilityId: "yip-strike",
        beatIndex: 1,
        beatType: "ABILITY",
      },
      {
        type: "DAMAGE",
        targetId: "p1",
        amount: 1,
        resultingHp: 3,
        source: "thief",
        sourceAbilityId: "yip-strike",
        beatIndex: 1,
        beatType: "ABILITY",
      },
      {
        type: "DAMAGE",
        targetId: "p2",
        amount: 4,
        resultingHp: 0,
        source: "e1",
        beatIndex: 1,
        beatType: "CLASH",
      },
      { type: "DROP", characterId: "p2", beatIndex: 1, beatType: "DROP" },
    ];

    expect(beatCharacterEffects(beatEvents)).toEqual({
      p1: { isActing: false, armourGained: 0, brokenFromArmour: null, abilityHpLost: 2, armourLost: 0, dealsAbilityHit: false, isDropped: false },
      p2: { isActing: false, armourGained: 0, brokenFromArmour: null, abilityHpLost: 0, armourLost: 0, dealsAbilityHit: false, isDropped: true },
    });
  });

  // deliberate assertion rewrite: every effect gains dealsAbilityHit (before: no dealsAbilityHit; after: dealsAbilityHit: false — no acting caster's ability hit anyone in this beat) — Phase 15
  it("BE7: ability hits on armour add up as armourLost, including the hit that breaks it", () => {
    const beatEvents: BattleEvent[] = [
      {
        type: "ARMOUR_DAMAGE",
        targetId: "p3",
        amount: 1,
        resultingArmour: 2,
        source: "thief",
        beatIndex: 1,
        beatType: "ABILITY",
      },
      {
        type: "ARMOUR_DAMAGE",
        targetId: "p3",
        amount: 2,
        resultingArmour: 0,
        source: "thief",
        beatIndex: 1,
        beatType: "ABILITY",
      },
    ];

    expect(beatCharacterEffects(beatEvents)).toEqual({
      p3: { isActing: false, armourGained: 0, brokenFromArmour: 2, abilityHpLost: 0, armourLost: 3, dealsAbilityHit: false, isDropped: false },
    });
  });

  it("BE8: a caster whose ability hits someone dealsAbilityHit; its target and a clash hitter don't", () => {
    const beatEvents: BattleEvent[] = [
      {
        type: "ABILITY_ACTIVATE",
        characterId: "thief",
        abilityId: "yip-strike",
        beatIndex: 3,
        beatType: "ABILITY",
      },
      {
        type: "DAMAGE",
        targetId: "p1",
        amount: 1,
        resultingHp: 4,
        source: "thief",
        sourceAbilityId: "yip-strike",
        beatIndex: 3,
        beatType: "ABILITY",
      },
      {
        type: "ARMOUR_DAMAGE",
        targetId: "e1",
        amount: 1,
        resultingArmour: 1,
        source: "p2",
        beatIndex: 3,
        beatType: "CLASH",
      },
    ];

    expect(beatCharacterEffects(beatEvents)).toEqual({
      thief: { isActing: true, armourGained: 0, brokenFromArmour: null, abilityHpLost: 0, armourLost: 0, dealsAbilityHit: true, isDropped: false },
      p1: { isActing: false, armourGained: 0, brokenFromArmour: null, abilityHpLost: 1, armourLost: 0, dealsAbilityHit: false, isDropped: false },
      e1: { isActing: false, armourGained: 0, brokenFromArmour: null, abilityHpLost: 0, armourLost: 1, dealsAbilityHit: false, isDropped: false },
    });
  });

  it("BE9: an acting caster whose ability only buffs doesn't dealsAbilityHit", () => {
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

    expect(beatCharacterEffects(beatEvents).p2?.dealsAbilityHit).toBe(false);
  });
});
