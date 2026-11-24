import { describe, it, expect } from "vitest";
import {
  abilityHpGainFromRefresh,
  experienceGainBeat,
  rosterSlotExitKind,
  type SubmittedCampIntent,
  rosterSlotExitAnimation,
  rosterSlotEffectFlashKind,
  armourStruckBeat,
} from "./rosterSlotAnimation";
import type { BeatCharacterEffect } from "@/lib/battle/beatCharacterEffects";

const mergeFromThreeIntoZeroAtFive: SubmittedCampIntent = {
  campIntent: {
    intentKind: "mergeCharacters",
    fromSlotIndex: 3,
    intoSlotIndex: 0,
  },
  submittedAtRevision: 5,
};

const sellSlotTwoAtFive: SubmittedCampIntent = {
  campIntent: { intentKind: "sellCharacter", slotIndex: 2 },
  submittedAtRevision: 5,
};

const repositionFromOneToFourAtFive: SubmittedCampIntent = {
  campIntent: { intentKind: "reposition", fromSlotIndex: 1, toSlotIndex: 4 },
  submittedAtRevision: 5,
};

describe("rosterSlotAnimation", () => {
  it("RA1: after a merge, the source slot's card is merged away; other slots shuffle", () => {
    expect(
      [0, 3, 4].map((slotIndex) =>
        rosterSlotExitKind(mergeFromThreeIntoZeroAtFive, 6, slotIndex),
      ),
    ).toEqual(["shuffle", "mergedAway", "shuffle"]);
  });

  it("RA2: after a sell, the sold slot's card is sold; other slots shuffle", () => {
    expect(
      [1, 2].map((slotIndex) =>
        rosterSlotExitKind(sellSlotTwoAtFive, 6, slotIndex),
      ),
    ).toEqual(["shuffle", "sold"]);
  });

  it("RA3: only the very next revision counts", () => {
    expect(
      [5, 7].map((currentRevision) =>
        rosterSlotExitKind(mergeFromThreeIntoZeroAtFive, currentRevision, 3),
      ),
    ).toEqual(["shuffle", "shuffle"]);
  });

  it("RA4: no submitted intent, or a reposition, always shuffles", () => {
    expect({
      none: rosterSlotExitKind(null, 6, 3),
      reposition: rosterSlotExitKind(repositionFromOneToFourAtFive, 6, 1),
    }).toEqual({ none: "shuffle", reposition: "shuffle" });
  });

  it("XB1: experienceGainBeat", () => {
    expect(
      (
        [
          [undefined, 0],
          [0, 0],
          [2, 1],
          [0, 1],
          [3, 5],
          [2, 3],
          [0, 15],
        ] as const
      ).map(([previousExperience, currentExperience]) =>
        experienceGainBeat(previousExperience, currentExperience),
      ),
    ).toEqual([
      { beatKind: "none" },
      { beatKind: "none" },
      { beatKind: "none" },
      { beatKind: "experienceGained", experienceGained: 1 },
      { beatKind: "experienceGained", experienceGained: 2 },
      { beatKind: "levelledUp", experienceGained: 1, newLevel: 2 },
      { beatKind: "levelledUp", experienceGained: 15, newLevel: 5 },
    ]);
  });

  it("AH1: abilityHpGainFromRefresh is the max-hp rise beyond the base gain, only when XP rose", () => {
    expect(
      (
        [
          [{ experience: 0, maxHp: 7 }, { experience: 1, maxHp: 9 }],
          [{ experience: 0, maxHp: 7 }, { experience: 3, maxHp: 13 }],
          [{ experience: 0, maxHp: 7 }, { experience: 1, maxHp: 8 }],
          [{ experience: 2, maxHp: 7 }, { experience: 2, maxHp: 7 }],
          [{ experience: 6, maxHp: 28 }, { experience: 6, maxHp: 30 }],
        ] as const
      ).map(([previous, current]) => abilityHpGainFromRefresh(previous, current)),
    ).toEqual([1, 3, 0, 0, 0]);
  });

  it("RX1: a dropped departing card always poofs; otherwise the front slot launches; otherwise its exit kind plays", () => {
    expect([
      rosterSlotExitAnimation({
        exitKind: "shuffle",
        isFrontSlotOnDeck: true,
        hasDepartingCharacterDropped: true,
      }),
      rosterSlotExitAnimation({
        exitKind: "sold",
        isFrontSlotOnDeck: false,
        hasDepartingCharacterDropped: true,
      }),
      rosterSlotExitAnimation({
        exitKind: "shuffle",
        isFrontSlotOnDeck: true,
        hasDepartingCharacterDropped: false,
      }),
      rosterSlotExitAnimation({
        exitKind: "mergedAway",
        isFrontSlotOnDeck: false,
        hasDepartingCharacterDropped: false,
      }),
      rosterSlotExitAnimation({
        exitKind: "shuffle",
        isFrontSlotOnDeck: false,
        hasDepartingCharacterDropped: false,
      }),
    ]).toEqual(["dropped", "dropped", "launch", "mergedAway", "shuffle"]);
  });
});

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

describe("rosterSlotEffectFlashKind", () => {
  it("RF1: no beat effect gives no flash", () => {
    expect(rosterSlotEffectFlashKind(undefined)).toBe("none");
  });

  it("RF2: hp lost to an ability flashes hpHit", () => {
    expect(rosterSlotEffectFlashKind(buildBeatEffect({ abilityHpLost: 2 }))).toBe("hpHit");
  });

  it("RF3: armour lost (including a break) flashes armourHit", () => {
    expect([
      rosterSlotEffectFlashKind(buildBeatEffect({ armourLost: 1 })),
      rosterSlotEffectFlashKind(buildBeatEffect({ armourLost: 2, brokenFromArmour: 2 })),
    ]).toEqual(["armourHit", "armourHit"]);
  });

  it("RF4: hp and armour lost in the same beat flashes hpHit", () => {
    expect(
      rosterSlotEffectFlashKind(buildBeatEffect({ armourLost: 2, brokenFromArmour: 2, abilityHpLost: 1 })),
    ).toBe("hpHit");
  });

  // deliberate assertion rewrite: gaining armour now flashes buff (before: "acting, gaining armour or dropping alone gives no flash" with armourGained: 1; after: armourGained removed from this case, see RF6) — Phase 15
  it("RF5: acting or dropping alone gives no flash", () => {
    expect(
      rosterSlotEffectFlashKind(buildBeatEffect({ isActing: true, isDropped: true })),
    ).toBe("none");
  });

  it("RF6: gaining armour flashes buff", () => {
    expect(rosterSlotEffectFlashKind(buildBeatEffect({ armourGained: 1 }))).toBe("buff");
  });

  it("RF7: a hit in the same beat as a buff wins (hpHit, then armourHit)", () => {
    expect([
      rosterSlotEffectFlashKind(buildBeatEffect({ armourGained: 1, abilityHpLost: 1 })),
      rosterSlotEffectFlashKind(buildBeatEffect({ armourGained: 1, armourLost: 1 })),
    ]).toEqual(["hpHit", "armourHit"]);
  });
});

describe("armourStruckBeat", () => {
  it("AS1: armour chipped without breaking gives a struck beat for this beat", () => {
    expect(armourStruckBeat(buildBeatEffect({ armourLost: 1 }), 6)).toEqual({
      armourBeatKind: "struck",
      beatKey: 6,
    });
  });

  it("AS2: a break or an armour gain in the same beat takes precedence (no struck beat)", () => {
    expect([
      armourStruckBeat(buildBeatEffect({ armourLost: 2, brokenFromArmour: 2 }), 6),
      armourStruckBeat(buildBeatEffect({ armourLost: 1, armourGained: 1 }), 6),
    ]).toEqual([undefined, undefined]);
  });

  it("AS3: no armour lost, no effect, or no beat key gives no struck beat", () => {
    expect([
      armourStruckBeat(buildBeatEffect({ abilityHpLost: 2 }), 6),
      armourStruckBeat(undefined, 6),
      armourStruckBeat(buildBeatEffect({ armourLost: 1 }), undefined),
    ]).toEqual([undefined, undefined, undefined]);
  });
});
