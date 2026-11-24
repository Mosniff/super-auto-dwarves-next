import { describe, it, expect } from "vitest";
import type { BeatCharacterEffect } from "@/lib/battle/beatCharacterEffects";
import { animationTempoSeconds } from "@/lib/animationTempo";
import {
  EVENTFUL_BEAT_DURATION_MS,
  TURN_START_ABILITY_BEAT_DURATION_MS,
} from "@/lib/battle/beatDurationMs";
import {
  battleFloaterTiming,
  floatersForBeat,
  type BattleBeatFloaterKind,
} from "./floatersForBeat";

function buildBeatEffect(
  overrides: Partial<BeatCharacterEffect>,
): BeatCharacterEffect {
  return {
    isActing: false,
    armourGained: 0,
    brokenFromArmour: null,
    abilityHpLost: 0,
    armourLost: 0,
    dealsAbilityHit: false,
    isDropped: false,
    ...overrides,
  };
}

describe("floatersForBeat", () => {
  it("BF1: no beat effect gives no floaters", () => {
    expect(floatersForBeat(undefined, 5)).toEqual([]);
  });

  it("BF2: no beat key gives no floaters, even with an effect", () => {
    expect(
      floatersForBeat(buildBeatEffect({ abilityHpLost: 2 }), undefined),
    ).toEqual([]);
  });

  it("BF3: armour gained gives an armourGain floater carrying the amount", () => {
    expect(floatersForBeat(buildBeatEffect({ armourGained: 2 }), 5)).toEqual([
      { floaterKey: "armour-gain-5", floaterKind: "armourGain", amount: 2 },
    ]);
  });

  it("BF4: broken armour gives an armourBreak floater", () => {
    expect(
      floatersForBeat(buildBeatEffect({ brokenFromArmour: 3 }), 5),
    ).toEqual([
      { floaterKey: "armour-break-5", floaterKind: "armourBreak", amount: 0 },
    ]);
  });

  it("BF5: hp lost to an ability gives an abilityHpLoss floater carrying the amount", () => {
    expect(floatersForBeat(buildBeatEffect({ abilityHpLost: 2 }), 5)).toEqual([
      {
        floaterKey: "ability-hp-loss-5",
        floaterKind: "abilityHpLoss",
        amount: 2,
      },
    ]);
  });

  it("BF6: all three in one beat come in the order gain, break, hp loss", () => {
    expect(
      floatersForBeat(
        buildBeatEffect({
          armourGained: 1,
          brokenFromArmour: 1,
          abilityHpLost: 4,
        }),
        7,
      ).map((floater) => floater.floaterKind),
    ).toEqual(["armourGain", "armourBreak", "abilityHpLoss"]);
  });

  it("BF7: acting or dropping alone gives no floaters", () => {
    expect(
      floatersForBeat(buildBeatEffect({ isActing: true, isDropped: true }), 5),
    ).toEqual([]);
  });
});

describe("battleFloaterTiming", () => {
  const FLOATER_KINDS: BattleBeatFloaterKind[] = ["armourGain", "armourBreak", "abilityHpLoss"];

  it("FT1: on a normal beat, a floater starts with the flash (BREAK! with the clash's impact) and rises for 0.45s, at the tempo", () => {
    expect([
      battleFloaterTiming("abilityHpLoss", "normal"),
      battleFloaterTiming("armourGain", "normal"),
      battleFloaterTiming("armourBreak", "normal"),
    ]).toEqual([
      { delaySeconds: animationTempoSeconds(0.3), durationSeconds: animationTempoSeconds(0.45) },
      { delaySeconds: animationTempoSeconds(0.3), durationSeconds: animationTempoSeconds(0.45) },
      { delaySeconds: animationTempoSeconds(0.28), durationSeconds: animationTempoSeconds(0.45) },
    ]);
  });

  it("FT2: on a quick (turn-start) beat, every floater starts almost at once and rises for 0.22s, at the tempo", () => {
    expect(FLOATER_KINDS.map((floaterKind) => battleFloaterTiming(floaterKind, "quick"))).toEqual(
      FLOATER_KINDS.map(() => ({
        delaySeconds: animationTempoSeconds(0.05),
        durationSeconds: animationTempoSeconds(0.22),
      })),
    );
  });

  it("FT3: every floater finishes inside its beat (an ability or clash beat when normal, a turn-start beat when quick)", () => {
    const finishesInsideItsBeat = FLOATER_KINDS.flatMap((floaterKind) => [
      (() => {
        const { delaySeconds, durationSeconds } = battleFloaterTiming(floaterKind, "normal");
        return (delaySeconds + durationSeconds) * 1000 <= EVENTFUL_BEAT_DURATION_MS;
      })(),
      (() => {
        const { delaySeconds, durationSeconds } = battleFloaterTiming(floaterKind, "quick");
        return (delaySeconds + durationSeconds) * 1000 <= TURN_START_ABILITY_BEAT_DURATION_MS;
      })(),
    ]);
    expect(finishesInsideItsBeat.every(Boolean)).toBe(true);
  });
});
