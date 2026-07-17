import { describe, it, expect } from "vitest";
import { formatBattleEvent } from "./formatBattleEvent";
import type { BattleEvent } from "./types";

describe("formatBattleEvent", () => {
  const nameMap = new Map([
    ["p1", "Borin"],
    ["e1", "Grukk"],
  ]);

  it("formats BATTLE_START", () => {
    const event: BattleEvent = { type: "BATTLE_START", beatIndex: 0 };

    expect(formatBattleEvent(event, nameMap)).toBe("Battle start!");
  });

  it("formats TURN_START", () => {
    const event: BattleEvent = { type: "TURN_START", turn: 1, beatIndex: 0 };

    expect(formatBattleEvent(event, nameMap)).toBe("Turn 1");
  });

  it("formats ATTACK", () => {
    const event: BattleEvent = {
      type: "ATTACK",
      attackerId: "p1",
      targetId: "e1",
      value: 4,
      beatIndex: 0,
    };

    expect(formatBattleEvent(event, nameMap)).toBe("Borin attacks Grukk");
  });

  it("formats DAMAGE", () => {
    const event: BattleEvent = {
      type: "DAMAGE",
      targetId: "e1",
      amount: 4,
      resultingHp: 2,
      source: "p1",
      beatIndex: 0,
    };

    expect(formatBattleEvent(event, nameMap)).toBe(
      "Grukk takes 4 damage (2 HP)",
    );
  });

  it("formats DAMAGE with a negative resultingHp shown as-is", () => {
    const event: BattleEvent = {
      type: "DAMAGE",
      targetId: "e1",
      amount: 5,
      resultingHp: -1,
      source: "p1",
      beatIndex: 0,
    };

    expect(formatBattleEvent(event, nameMap)).toBe(
      "Grukk takes 5 damage (-1 HP)",
    );
  });

  it("formats DROP", () => {
    const event: BattleEvent = {
      type: "DROP",
      characterId: "p1",
      beatIndex: 0,
    };

    expect(formatBattleEvent(event, nameMap)).toBe("Borin drops");
  });

  it("formats TIMEOUT", () => {
    const event: BattleEvent = { type: "TIMEOUT", beatIndex: 0 };

    expect(formatBattleEvent(event, nameMap)).toBe(
      "Turn limit reached — stalemate",
    );
  });

  it("formats BATTLE_END with outcome playerWin", () => {
    const event: BattleEvent = {
      type: "BATTLE_END",
      outcome: "playerWin",
      beatIndex: 0,
    };

    expect(formatBattleEvent(event, nameMap)).toBe("Victory!");
  });

  it("formats BATTLE_END with outcome enemyWin", () => {
    const event: BattleEvent = {
      type: "BATTLE_END",
      outcome: "enemyWin",
      beatIndex: 0,
    };

    expect(formatBattleEvent(event, nameMap)).toBe("Defeat");
  });

  it("formats BATTLE_END with outcome draw", () => {
    const event: BattleEvent = {
      type: "BATTLE_END",
      outcome: "draw",
      beatIndex: 0,
    };

    expect(formatBattleEvent(event, nameMap)).toBe("Draw");
  });

  it("falls back to the raw id when a character id is not in the nameMap", () => {
    const event: BattleEvent = {
      type: "DROP",
      characterId: "unknown-id",
      beatIndex: 0,
    };

    expect(formatBattleEvent(event, nameMap)).toBe("unknown-id drops");
  });
});
