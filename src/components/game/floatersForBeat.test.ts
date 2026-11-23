import { describe, it, expect } from "vitest";
import type { BeatCharacterEffect } from "@/lib/battle/beatCharacterEffects";
import { floatersForBeat } from "./floatersForBeat";

function buildBeatEffect(
  overrides: Partial<BeatCharacterEffect>,
): BeatCharacterEffect {
  return {
    isActing: false,
    armourGained: 0,
    brokenFromArmour: null,
    abilityHpLost: 0,
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
