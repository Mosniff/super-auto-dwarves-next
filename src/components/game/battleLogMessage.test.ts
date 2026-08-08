import { describe, it, expect } from "vitest";
import { battleLogMessage } from "./battleLogMessage";
import type { BattleEventDescriptor } from "@/lib/battle/types";

describe("battleLogMessage", () => {
  it("maps battleStart", () => {
    const descriptor: BattleEventDescriptor = { kind: "battleStart" };

    expect(battleLogMessage(descriptor)).toEqual({ key: "battleStart" });
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
});
