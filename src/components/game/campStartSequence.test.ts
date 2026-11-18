import { describe, it, expect } from "vitest";
import {
  campStartSequenceTimeline,
  pendingCampStartGold,
} from "./campStartSequence";

describe("campStartSequenceTimeline", () => {
  it("TL1: no activations, no timeline (and so no lock)", () => {
    expect(campStartSequenceTimeline(0)).toEqual([]);
  });

  it("TL2: two activations: each activates, then lands; finish after the last floater", () => {
    expect(campStartSequenceTimeline(2)).toEqual([
      { atMs: 550, timelineEventKind: "activate", activationIndex: 0 },
      { atMs: 850, timelineEventKind: "land", activationIndex: 0 },
      { atMs: 1450, timelineEventKind: "activate", activationIndex: 1 },
      { atMs: 1750, timelineEventKind: "land", activationIndex: 1 },
      { atMs: 2950, timelineEventKind: "finish" },
    ]);
  });
});

describe("pendingCampStartGold", () => {
  it("PG1: pending gold is the gold of the activations that haven't landed", () => {
    expect(
      [0, 1, 2].map((landedActivationCount) =>
        pendingCampStartGold([1, 3], landedActivationCount),
      ),
    ).toEqual([4, 3, 0]);
  });
});
