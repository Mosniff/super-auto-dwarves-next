import { describe, it, expect } from "vitest";
import {
  abilityHpGainFromRefresh,
  experienceGainBeat,
  rosterSlotExitKind,
  type SubmittedCampIntent,
} from "./rosterSlotAnimation";

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
});
