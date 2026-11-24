import { describe, it, expect } from "vitest";
import type { CampRoster } from "@/lib/game/campRoster";
import { buildTestCharacter } from "@/test/characterFixtures";
import { animationTempoMs } from "@/lib/animationTempo";
import {
  CAMP_START_FLOATER_DURATION_MS,
  CAMP_START_LAND_DELAY_MS,
  CAMP_START_SEQUENCE_START_DELAY_MS,
  CAMP_START_STEP_MS,
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

  // deliberate assertion rewrite: the timeline is stated in its constants (before: literal 550 / 850 / 1450 / 1750 / 2950 ms; after: the same sums of CAMP_START_* constants), so the animation tempo can be tuned without editing tests; TL-T pins the base values — Phase 15
  it("TL2: two activations: each activates, then lands; finish after the last floater", () => {
    const firstActivateAtMs = CAMP_START_SEQUENCE_START_DELAY_MS;
    const secondActivateAtMs = firstActivateAtMs + CAMP_START_STEP_MS;
    expect(campStartSequenceTimeline(2)).toEqual([
      { atMs: firstActivateAtMs, timelineEventKind: "activate", activationIndex: 0 },
      { atMs: firstActivateAtMs + CAMP_START_LAND_DELAY_MS, timelineEventKind: "land", activationIndex: 0 },
      { atMs: secondActivateAtMs, timelineEventKind: "activate", activationIndex: 1 },
      { atMs: secondActivateAtMs + CAMP_START_LAND_DELAY_MS, timelineEventKind: "land", activationIndex: 1 },
      {
        atMs: secondActivateAtMs + CAMP_START_LAND_DELAY_MS + CAMP_START_FLOATER_DURATION_MS,
        timelineEventKind: "finish",
      },
    ]);
  });

  it("TL-T: the camp-start timings are their base values scaled by the animation tempo", () => {
    expect([
      CAMP_START_SEQUENCE_START_DELAY_MS,
      CAMP_START_STEP_MS,
      CAMP_START_LAND_DELAY_MS,
      CAMP_START_FLOATER_DURATION_MS,
    ]).toEqual([
      animationTempoMs(550),
      animationTempoMs(900),
      animationTempoMs(300),
      animationTempoMs(1200),
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
