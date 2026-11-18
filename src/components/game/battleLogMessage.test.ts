import { describe, it, expect } from "vitest";
import { battleLogMessage } from "./battleLogMessage";
import type { BattleEventDescriptor } from "@/lib/battle/types";

describe("battleLogMessage", () => {
  // deliberate assertion rewrite: { kind: "battleStart" } / { key: "battleStart" } before; descriptor gains playerFactionId: "dwarf", enemyFactionId: "kobold"; expectation becomes { key: "battleStart", factionParams: { playerFaction: "dwarf", enemyFaction: "kobold" } } after — Phase 13
  it("maps battleStart", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "battleStart",
      playerFactionId: "dwarf",
      enemyFactionId: "kobold",
    };

    expect(battleLogMessage(descriptor)).toEqual({
      key: "battleStart",
      factionParams: { playerFaction: "dwarf", enemyFaction: "kobold" },
    });
  });

  it("LM1: frontsEngage maps to its own key", () => {
    const descriptor: BattleEventDescriptor = { kind: "frontsEngage" };

    expect(battleLogMessage(descriptor)).toEqual({ key: "frontsEngage" });
  });

  it("maps turnStart", () => {
    const descriptor: BattleEventDescriptor = { kind: "turnStart", turn: 3 };

    expect(battleLogMessage(descriptor)).toEqual({
      key: "turnStart",
      params: { turn: 3 },
    });
  });

  it("maps attack", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "attack",
      attacker: "Borin",
      target: "Grukk",
    };

    expect(battleLogMessage(descriptor)).toEqual({
      key: "attack",
      params: { attacker: "Borin", target: "Grukk" },
    });
  });

  it("maps damage", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "damage",
      target: "Grukk",
      amount: 4,
      resultingHp: 2,
    };

    expect(battleLogMessage(descriptor)).toEqual({
      key: "damage",
      params: { target: "Grukk", amount: 4, resultingHp: 2 },
    });
  });

  it("maps armourDamage with armour left to armourDamage", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "armourDamage",
      target: "Grukk",
      amount: 2,
      resultingArmour: 1,
    };

    expect(battleLogMessage(descriptor)).toEqual({
      key: "armourDamage",
      params: { target: "Grukk", amount: 2 },
    });
  });

  it("maps armourDamage that breaks the armour to armourBreak", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "armourDamage",
      target: "Grukk",
      amount: 3,
      resultingArmour: 0,
    };

    expect(battleLogMessage(descriptor)).toEqual({
      key: "armourBreak",
      params: { target: "Grukk" },
    });
  });

  it("maps drop", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "drop",
      character: "Borin",
    };

    expect(battleLogMessage(descriptor)).toEqual({
      key: "drop",
      params: { character: "Borin" },
    });
  });

  it("maps timeout", () => {
    const descriptor: BattleEventDescriptor = { kind: "timeout" };

    expect(battleLogMessage(descriptor)).toEqual({ key: "timeout" });
  });

  it("maps battleEnd with outcome playerWin to victory", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "battleEnd",
      outcome: "playerWin",
    };

    expect(battleLogMessage(descriptor)).toEqual({ key: "victory" });
  });

  it("maps battleEnd with outcome enemyWin to defeat", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "battleEnd",
      outcome: "enemyWin",
    };

    expect(battleLogMessage(descriptor)).toEqual({ key: "defeat" });
  });

  it("maps battleEnd with outcome draw to draw", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "battleEnd",
      outcome: "draw",
    };

    expect(battleLogMessage(descriptor)).toEqual({ key: "draw" });
  });

  it("maps abilityActivate to the ability's battle cry in the ability namespace", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "abilityActivate",
      abilityId: "tighten-those-straps-son",
      character: "Ogden",
    };

    expect(battleLogMessage(descriptor)).toEqual({
      namespace: "ability",
      key: "tighten-those-straps-son.battleCry",
      params: { character: "Ogden" },
    });
  });

  it("maps abilityStatChange to the ability's target line in the ability namespace", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "abilityStatChange",
      abilityId: "tighten-those-straps-son",
      target: "Borin",
      stat: "armour",
      amount: 1,
      resultingValue: 2,
    };

    expect(battleLogMessage(descriptor)).toEqual({
      namespace: "ability",
      key: "tighten-those-straps-son.targetEffect",
      params: { target: "Borin", amount: 1 },
    });
  });
});
