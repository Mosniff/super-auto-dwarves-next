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
      // deliberate input rewrite: name string → label (Phase 14)
      attacker: { name: "Borin", side: "player" },
      // deliberate input rewrite: name string → label (Phase 14)
      target: { name: "Grukk", side: "enemy" },
    };

    expect(battleLogMessage(descriptor)).toEqual({
      key: "attack",
      params: { attacker: "Borin", target: "Grukk" },
      // deliberate assertion rewrite: adds characterSides (Phase 14)
      characterSides: { attacker: "player", target: "enemy" },
    });
  });

  it("maps damage", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "damage",
      // deliberate input rewrite: name string → label (Phase 14)
      target: { name: "Grukk", side: "enemy" },
      amount: 4,
      resultingHp: 2,
    };

    expect(battleLogMessage(descriptor)).toEqual({
      key: "damage",
      params: { target: "Grukk", amount: 4, resultingHp: 2 },
      // deliberate assertion rewrite: adds characterSides (Phase 14)
      characterSides: { target: "enemy" },
    });
  });

  it("maps armourDamage with armour left to armourDamage", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "armourDamage",
      // deliberate input rewrite: name string → label (Phase 14)
      target: { name: "Grukk", side: "enemy" },
      amount: 2,
      resultingArmour: 1,
    };

    expect(battleLogMessage(descriptor)).toEqual({
      key: "armourDamage",
      params: { target: "Grukk", amount: 2 },
      // deliberate assertion rewrite: adds characterSides (Phase 14)
      characterSides: { target: "enemy" },
    });
  });

  it("maps armourDamage that breaks the armour to armourBreak", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "armourDamage",
      // deliberate input rewrite: name string → label (Phase 14)
      target: { name: "Grukk", side: "enemy" },
      amount: 3,
      resultingArmour: 0,
    };

    expect(battleLogMessage(descriptor)).toEqual({
      key: "armourBreak",
      params: { target: "Grukk" },
      // deliberate assertion rewrite: adds characterSides (Phase 14)
      characterSides: { target: "enemy" },
    });
  });

  it("maps drop", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "drop",
      // deliberate input rewrite: name string → label (Phase 14)
      character: { name: "Borin", side: "player" },
    };

    expect(battleLogMessage(descriptor)).toEqual({
      key: "drop",
      params: { character: "Borin" },
      // deliberate assertion rewrite: adds characterSides (Phase 14)
      characterSides: { character: "player" },
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
      // deliberate input rewrite: name string → label (Phase 14)
      character: { name: "Ogden", side: "player" },
    };

    expect(battleLogMessage(descriptor)).toEqual({
      namespace: "ability",
      key: "tighten-those-straps-son.battleCry",
      params: { character: "Ogden" },
      // deliberate assertion rewrite: adds characterSides (Phase 14)
      characterSides: { character: "player" },
    });
  });

  it("maps abilityStatChange to the ability's target line in the ability namespace", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "abilityStatChange",
      abilityId: "tighten-those-straps-son",
      // deliberate input rewrite: name string → label (Phase 14)
      target: { name: "Borin", side: "player" },
      stat: "armour",
      amount: 1,
      resultingValue: 2,
    };

    expect(battleLogMessage(descriptor)).toEqual({
      namespace: "ability",
      key: "tighten-those-straps-son.targetEffect",
      params: { target: "Borin", amount: 1 },
      // deliberate assertion rewrite: adds characterSides (Phase 14)
      characterSides: { target: "player" },
    });
  });

  it("AD2: maps abilityDamage to the ability's own targetEffect line", () => {
    const descriptor: BattleEventDescriptor = {
      kind: "abilityDamage",
      abilityId: "yip-strike",
      // deliberate input rewrite: name string → label (Phase 14)
      target: { name: "Borin", side: "player" },
      amount: 1,
    };

    expect(battleLogMessage(descriptor)).toEqual({
      namespace: "ability",
      key: "yip-strike.targetEffect",
      params: { target: "Borin", amount: 1 },
      // deliberate assertion rewrite: adds characterSides (Phase 14)
      characterSides: { target: "player" },
    });
  });
});
