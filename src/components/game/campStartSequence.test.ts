import { describe, it, expect } from "vitest";
import type { CampRoster } from "@/lib/game/campRoster";
import { buildTestCharacter } from "@/test/characterFixtures";
import {
  CAMP_START_SEQUENCE_NOT_STARTED,
  advanceCampStartSequenceProgress,
  campStartActivationsToPlay,
  campStartSequenceTimeline,
  campStartSlotBeat,
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

describe("campStartActivationsToPlay", () => {
  it("PL1: plays the activations only on arrival from battle without reduced motion", () => {
    const norbin = buildTestCharacter({
      id: "norbin-1",
      name: "Norbin",
      characterTemplateId: "norbin",
    });
    const campRoster: CampRoster = [norbin, null, null, null, null, null, null];

    expect([
      campStartActivationsToPlay("battlePhase", false, campRoster),
      campStartActivationsToPlay(null, false, campRoster),
      campStartActivationsToPlay("battlePhase", true, campRoster),
    ]).toEqual([
      [
        {
          characterId: "norbin-1",
          slotIndex: 0,
          abilityId: "penny-pincher",
          goldGained: 1,
        },
      ],
      [],
      [],
    ]);
  });
});

describe("advanceCampStartSequenceProgress", () => {
  it("PR1: folding the two-activation timeline gives the progress after each event", () => {
    const progressAfterEachEvent = campStartSequenceTimeline(2).reduce(
      (progressList, timelineEvent) => [
        ...progressList,
        advanceCampStartSequenceProgress(
          progressList[progressList.length - 1] ??
            CAMP_START_SEQUENCE_NOT_STARTED,
          timelineEvent,
        ),
      ],
      [] as ReturnType<typeof advanceCampStartSequenceProgress>[],
    );

    expect(progressAfterEachEvent).toEqual([
      { actingActivationIndex: 0, landedActivationCount: 0, isFinished: false },
      { actingActivationIndex: 0, landedActivationCount: 1, isFinished: false },
      { actingActivationIndex: 1, landedActivationCount: 1, isFinished: false },
      { actingActivationIndex: 1, landedActivationCount: 2, isFinished: false },
      { actingActivationIndex: null, landedActivationCount: 2, isFinished: true },
    ]);
  });
});

describe("campStartSlotBeat", () => {
  it("SB1: a slot's beat: acting, landed gold, nothing without an activation, nothing once finished", () => {
    const activations = [
      { characterId: "a", slotIndex: 0, abilityId: "penny-pincher" as const, goldGained: 1 },
      { characterId: "b", slotIndex: 2, abilityId: "penny-pincher" as const, goldGained: 3 },
    ];
    const midSequence = {
      actingActivationIndex: 1,
      landedActivationCount: 1,
      isFinished: false,
    };
    const finished = {
      actingActivationIndex: null,
      landedActivationCount: 2,
      isFinished: true,
    };

    expect(
      [midSequence, finished].map((progress) =>
        [0, 1, 2].map((slotIndex) =>
          campStartSlotBeat(activations, progress, slotIndex),
        ),
      ),
    ).toEqual([
      [
        { isActing: false, landedGold: 1 },
        undefined,
        { isActing: true, landedGold: null },
      ],
      [undefined, undefined, undefined],
    ]);
  });
});
