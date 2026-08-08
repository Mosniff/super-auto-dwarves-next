import { describe, it, expect } from "vitest";
import { describeBattleEvent } from "./describeBattleEvent";
import type { BattleEvent } from "./types";

describe("describeBattleEvent", () => {
  const nameMap = new Map([
    ["p1", "Borin"],
    ["e1", "Grukk"],
  ]);

  it("describes BATTLE_START", () => {
    const event: BattleEvent = { type: "BATTLE_START", beatIndex: 0, beatType: "BATTLE_START" };

    expect(describeBattleEvent(event, nameMap)).toEqual({ kind: "battleStart" });
  });

  it("describes TURN_START", () => {
    const event: BattleEvent = { type: "TURN_START", turn: 1, beatIndex: 0, beatType: "TURN_START" };

    expect(describeBattleEvent(event, nameMap)).toEqual({
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

    expect(describeBattleEvent(event, nameMap)).toEqual({
      kind: "attack",
      attacker: "Borin",
      target: "Grukk",
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

    expect(describeBattleEvent(event, nameMap)).toEqual({
      kind: "damage",
      target: "Grukk",
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

    expect(describeBattleEvent(event, nameMap)).toEqual({
      kind: "damage",
      target: "Grukk",
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

    expect(describeBattleEvent(event, nameMap)).toEqual({
      kind: "drop",
      character: "Borin",
    });
  });

  it("describes TIMEOUT", () => {
    const event: BattleEvent = { type: "TIMEOUT", beatIndex: 0, beatType: "TIMEOUT" };

    expect(describeBattleEvent(event, nameMap)).toEqual({ kind: "timeout" });
  });

  it("describes BATTLE_END with outcome playerWin", () => {
    const event: BattleEvent = {
      type: "BATTLE_END",
      outcome: "playerWin",
      beatIndex: 0,
      beatType: "BATTLE_END",
    };

    expect(describeBattleEvent(event, nameMap)).toEqual({
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

    expect(describeBattleEvent(event, nameMap)).toEqual({
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

    expect(describeBattleEvent(event, nameMap)).toEqual({
      kind: "battleEnd",
      outcome: "draw",
    });
  });

  it("falls back to the raw id when a character id is not in the nameMap", () => {
    const event: BattleEvent = {
      type: "DROP",
      characterId: "unknown-id",
      beatIndex: 0,
      beatType: "DROP",
    };

    expect(describeBattleEvent(event, nameMap)).toEqual({
      kind: "drop",
      character: "unknown-id",
    });
  });
});
