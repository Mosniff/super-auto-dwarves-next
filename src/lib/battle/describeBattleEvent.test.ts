import { describe, it, expect } from "vitest";
import { describeBattleEvent } from "./describeBattleEvent";
import type { BattleCharacterLabel, BattleEvent } from "./types";

describe("describeBattleEvent", () => {
  const characterLabelMap = new Map<string, BattleCharacterLabel>([
    ["p1", { name: "Borin", side: "player" }],
    ["e1", { name: "Grukk", side: "enemy" }],
    ["p3", { name: "Ogden", side: "player" }],
  ]);

  // deliberate assertion rewrite: { type: "BATTLE_START", beatIndex: 0, beatType: "BATTLE_START" } / { kind: "battleStart" } before; event gains playerFactionId: "dwarf", enemyFactionId: "kobold"; expectation becomes { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "kobold" } after — Phase 13
  it("describes BATTLE_START", () => {
    const event: BattleEvent = {
      type: "BATTLE_START",
      playerFactionId: "dwarf",
      enemyFactionId: "kobold",
      beatIndex: 0,
      beatType: "BATTLE_START",
    };

    expect(describeBattleEvent(event, characterLabelMap)).toEqual({
      kind: "battleStart",
      playerFactionId: "dwarf",
      enemyFactionId: "kobold",
    });
  });

  it("DE1: FRONTS_ENGAGE describes as frontsEngage", () => {
    const event: BattleEvent = {
      type: "FRONTS_ENGAGE",
      beatIndex: 1,
      beatType: "ENGAGE",
    };

    expect(describeBattleEvent(event, new Map())).toEqual({
      kind: "frontsEngage",
    });
  });

  it("describes TURN_START", () => {
    const event: BattleEvent = { type: "TURN_START", turn: 1, beatIndex: 0, beatType: "TURN_START" };

    expect(describeBattleEvent(event, characterLabelMap)).toEqual({
      kind: "turnStart",
      turn: 1,
    });
  });

  it("describes ATTACK", () => {
    const event: BattleEvent = {
      type: "ATTACK",
      attackerId: "p1",
      targetId: "e1",
      value: 4,
      beatIndex: 0,
      beatType: "CLASH",
    };

    expect(describeBattleEvent(event, characterLabelMap)).toEqual({
      kind: "attack",
      // deliberate assertion rewrite: "Borin" → { name: "Borin", side: "player" } (Phase 14)
      attacker: { name: "Borin", side: "player" },
      // deliberate assertion rewrite: "Grukk" → { name: "Grukk", side: "enemy" } (Phase 14)
      target: { name: "Grukk", side: "enemy" },
    });
  });

  it("describes DAMAGE", () => {
    const event: BattleEvent = {
      type: "DAMAGE",
      targetId: "e1",
      amount: 4,
      resultingHp: 2,
      source: "p1",
      beatIndex: 0,
      beatType: "CLASH",
    };

    expect(describeBattleEvent(event, characterLabelMap)).toEqual({
      kind: "damage",
      // deliberate assertion rewrite: "Grukk" → { name: "Grukk", side: "enemy" } (Phase 14)
      target: { name: "Grukk", side: "enemy" },
      amount: 4,
      resultingHp: 2,
    });
  });

  it("describes DAMAGE with a negative resultingHp shown as-is", () => {
    const event: BattleEvent = {
      type: "DAMAGE",
      targetId: "e1",
      amount: 5,
      resultingHp: -1,
      source: "p1",
      beatIndex: 0,
      beatType: "CLASH",
    };

    expect(describeBattleEvent(event, characterLabelMap)).toEqual({
      kind: "damage",
      // deliberate assertion rewrite: "Grukk" → { name: "Grukk", side: "enemy" } (Phase 14)
      target: { name: "Grukk", side: "enemy" },
      amount: 5,
      resultingHp: -1,
    });
  });

  it("describes DROP", () => {
    const event: BattleEvent = {
      type: "DROP",
      characterId: "p1",
      beatIndex: 0,
      beatType: "DROP",
    };

    expect(describeBattleEvent(event, characterLabelMap)).toEqual({
      kind: "drop",
      // deliberate assertion rewrite: "Borin" → { name: "Borin", side: "player" } (Phase 14)
      character: { name: "Borin", side: "player" },
    });
  });

  it("describes TIMEOUT", () => {
    const event: BattleEvent = { type: "TIMEOUT", beatIndex: 0, beatType: "TIMEOUT" };

    expect(describeBattleEvent(event, characterLabelMap)).toEqual({ kind: "timeout" });
  });

  it("describes BATTLE_END with outcome playerWin", () => {
    const event: BattleEvent = {
      type: "BATTLE_END",
      outcome: "playerWin",
      beatIndex: 0,
      beatType: "BATTLE_END",
    };

    expect(describeBattleEvent(event, characterLabelMap)).toEqual({
      kind: "battleEnd",
      outcome: "playerWin",
    });
  });

  it("describes BATTLE_END with outcome enemyWin", () => {
    const event: BattleEvent = {
      type: "BATTLE_END",
      outcome: "enemyWin",
      beatIndex: 0,
      beatType: "BATTLE_END",
    };

    expect(describeBattleEvent(event, characterLabelMap)).toEqual({
      kind: "battleEnd",
      outcome: "enemyWin",
    });
  });

  it("describes BATTLE_END with outcome draw", () => {
    const event: BattleEvent = {
      type: "BATTLE_END",
      outcome: "draw",
      beatIndex: 0,
      beatType: "BATTLE_END",
    };

    expect(describeBattleEvent(event, characterLabelMap)).toEqual({
      kind: "battleEnd",
      outcome: "draw",
    });
  });

  it("describes ARMOUR_DAMAGE", () => {
    const event: BattleEvent = {
      type: "ARMOUR_DAMAGE",
      targetId: "e1",
      amount: 2,
      resultingArmour: 1,
      source: "p1",
      beatIndex: 0,
      beatType: "CLASH",
    };

    expect(describeBattleEvent(event, characterLabelMap)).toEqual({
      kind: "armourDamage",
      // deliberate assertion rewrite: "Grukk" → { name: "Grukk", side: "enemy" } (Phase 14)
      target: { name: "Grukk", side: "enemy" },
      amount: 2,
      resultingArmour: 1,
    });
  });

  it("describes ABILITY_ACTIVATE", () => {
    const event: BattleEvent = {
      type: "ABILITY_ACTIVATE",
      characterId: "p3",
      abilityId: "tighten-those-straps-son",
      beatIndex: 1,
      beatType: "ABILITY",
    };

    expect(describeBattleEvent(event, characterLabelMap)).toEqual({
      kind: "abilityActivate",
      abilityId: "tighten-those-straps-son",
      // deliberate assertion rewrite: "Ogden" → { name: "Ogden", side: "player" } (Phase 14)
      character: { name: "Ogden", side: "player" },
    });
  });

  it("describes STAT_CHANGE", () => {
    const event: BattleEvent = {
      type: "STAT_CHANGE",
      targetId: "p1",
      stat: "armour",
      amount: 1,
      resultingValue: 2,
      source: "p3",
      sourceAbilityId: "tighten-those-straps-son",
      beatIndex: 1,
      beatType: "ABILITY",
    };

    expect(describeBattleEvent(event, characterLabelMap)).toEqual({
      kind: "abilityStatChange",
      abilityId: "tighten-those-straps-son",
      // deliberate assertion rewrite: "Borin" → { name: "Borin", side: "player" } (Phase 14)
      target: { name: "Borin", side: "player" },
      stat: "armour",
      amount: 1,
      resultingValue: 2,
    });
  });

  it("falls back to the raw id, with side unknown, when a character id is not in the label map", () => {
    const event: BattleEvent = {
      type: "DROP",
      characterId: "unknown-id",
      beatIndex: 0,
      beatType: "DROP",
    };

    expect(describeBattleEvent(event, characterLabelMap)).toEqual({
      kind: "drop",
      // deliberate assertion rewrite: "unknown-id" → { name: "unknown-id", side: "unknown" } (Phase 14)
      character: { name: "unknown-id", side: "unknown" },
    });
  });

  it("AD1: damage dealt by an ability becomes an abilityDamage descriptor", () => {
    const event: BattleEvent = {
      type: "DAMAGE",
      targetId: "p1",
      amount: 1,
      resultingHp: 6,
      source: "e1",
      sourceAbilityId: "yip-strike",
      beatIndex: 1,
      beatType: "ABILITY",
    };

    expect(describeBattleEvent(event, characterLabelMap)).toEqual({
      kind: "abilityDamage",
      abilityId: "yip-strike",
      // deliberate assertion rewrite: "Borin" → { name: "Borin", side: "player" } (Phase 14)
      target: { name: "Borin", side: "player" },
      amount: 1,
    });
  });
});
