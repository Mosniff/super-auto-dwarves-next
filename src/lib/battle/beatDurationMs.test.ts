import { describe, it, expect } from "vitest";
import {
  beatDurationMs,
  EVENTFUL_BEAT_DURATION_MS,
  QUIET_BEAT_DURATION_MS,
} from "./beatDurationMs";
import type { BattleEvent } from "./types";

describe("beatDurationMs", () => {
  it("returns the eventful duration for a beat with a DAMAGE event", () => {
    const beatEvents: BattleEvent[] = [
      {
        type: "DAMAGE",
        targetId: "e1",
        amount: 4,
        resultingHp: 2,
        source: "p1",
        beatIndex: 0,
      },
    ];

    expect(beatDurationMs(beatEvents)).toBe(EVENTFUL_BEAT_DURATION_MS);
  });

  it("returns the eventful duration for a beat with a DROP event", () => {
    const beatEvents: BattleEvent[] = [
      { type: "DROP", characterId: "e1", beatIndex: 0 },
    ];

    expect(beatDurationMs(beatEvents)).toBe(EVENTFUL_BEAT_DURATION_MS);
  });

  it("returns the eventful duration for a beat with a DROP alongside other events", () => {
    const beatEvents: BattleEvent[] = [
      {
        type: "DAMAGE",
        targetId: "e1",
        amount: 4,
        resultingHp: 0,
        source: "p1",
        beatIndex: 0,
      },
      { type: "DROP", characterId: "e1", beatIndex: 0 },
    ];

    expect(beatDurationMs(beatEvents)).toBe(EVENTFUL_BEAT_DURATION_MS);
  });

  it("returns the quiet duration for a TURN_START-only beat", () => {
    const beatEvents: BattleEvent[] = [
      { type: "TURN_START", turn: 1, beatIndex: 0 },
    ];

    expect(beatDurationMs(beatEvents)).toBe(QUIET_BEAT_DURATION_MS);
  });

  it("returns the quiet duration for a BATTLE_START-only beat", () => {
    const beatEvents: BattleEvent[] = [{ type: "BATTLE_START", beatIndex: 0 }];

    expect(beatDurationMs(beatEvents)).toBe(QUIET_BEAT_DURATION_MS);
  });

  it("returns the quiet duration for an ATTACK-only beat", () => {
    const beatEvents: BattleEvent[] = [
      {
        type: "ATTACK",
        attackerId: "p1",
        targetId: "e1",
        value: 4,
        beatIndex: 0,
      },
    ];

    expect(beatDurationMs(beatEvents)).toBe(QUIET_BEAT_DURATION_MS);
  });

  it("returns the quiet duration for a BATTLE_END-only beat", () => {
    const beatEvents: BattleEvent[] = [
      { type: "BATTLE_END", outcome: "playerWin", beatIndex: 0 },
    ];

    expect(beatDurationMs(beatEvents)).toBe(QUIET_BEAT_DURATION_MS);
  });

  it("returns the quiet duration for an empty beat (defensive default)", () => {
    const beatEvents: BattleEvent[] = [];

    expect(beatDurationMs(beatEvents)).toBe(QUIET_BEAT_DURATION_MS);
  });

  it("both durations are at most 800ms", () => {
    expect(EVENTFUL_BEAT_DURATION_MS).toBeLessThanOrEqual(800);
    expect(QUIET_BEAT_DURATION_MS).toBeLessThanOrEqual(800);
  });
});
