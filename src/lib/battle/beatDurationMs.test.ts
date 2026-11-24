import { describe, it, expect } from "vitest";
import { animationTempoMs } from "@/lib/animationTempo";
import {
  abilityCasterPulseKind,
  autoplayBeatDelayMs,
  beatDurationMs,
  DROP_BEAT_DURATION_MS,
  ENGAGE_BEAT_DURATION_MS,
  EVENTFUL_BEAT_DURATION_MS,
  PREPARE_BEAT_DURATION_MS,
  QUIET_BEAT_DURATION_MS,
  SLOW_AUTOPLAY_BEAT_DURATION_MULTIPLIER,
  TURN_START_ABILITY_BEAT_DURATION_MS,
} from "./beatDurationMs";

describe("beatDurationMs", () => {
  it("returns the eventful duration for a CLASH beat", () => {
    expect(beatDurationMs("CLASH")).toBe(EVENTFUL_BEAT_DURATION_MS);
  });

  it("returns the drop duration for a DROP beat", () => {
    expect(beatDurationMs("DROP")).toBe(DROP_BEAT_DURATION_MS);
  });

  it("returns the quiet duration for a TURN_START beat", () => {
    expect(beatDurationMs("TURN_START")).toBe(QUIET_BEAT_DURATION_MS);
  });

  it("returns the prepare duration for a BATTLE_START (prepare) beat", () => {
    expect(beatDurationMs("BATTLE_START")).toBe(PREPARE_BEAT_DURATION_MS);
  });

  it("returns the quiet duration for a TIMEOUT beat", () => {
    expect(beatDurationMs("TIMEOUT")).toBe(QUIET_BEAT_DURATION_MS);
  });

  it("returns the quiet duration for a BATTLE_END beat", () => {
    expect(beatDurationMs("BATTLE_END")).toBe(QUIET_BEAT_DURATION_MS);
  });

  it("returns the quiet duration for undefined (no current beat yet)", () => {
    expect(beatDurationMs(undefined)).toBe(QUIET_BEAT_DURATION_MS);
  });

  it("no beat duration exceeds the DROP ceiling (autoplay steps its fixed timer by the max beat duration, so nothing may be longer than DROP_BEAT_DURATION_MS)", () => {
    expect(EVENTFUL_BEAT_DURATION_MS).toBeLessThanOrEqual(DROP_BEAT_DURATION_MS);
    expect(QUIET_BEAT_DURATION_MS).toBeLessThanOrEqual(DROP_BEAT_DURATION_MS);
  });

  it("the prepare beat is longer than a quiet beat and within the DROP ceiling", () => {
    expect([
      PREPARE_BEAT_DURATION_MS > QUIET_BEAT_DURATION_MS,
      PREPARE_BEAT_DURATION_MS <= DROP_BEAT_DURATION_MS,
    ]).toEqual([true, true]);
  });

  it("returns the eventful duration for an ABILITY beat", () => {
    expect(beatDurationMs("ABILITY")).toBe(EVENTFUL_BEAT_DURATION_MS);
  });

  it("BD1: returns the engage duration for an ENGAGE beat", () => {
    expect(beatDurationMs("ENGAGE")).toBe(ENGAGE_BEAT_DURATION_MS);
  });

  it("BD2: the engage beat is longer than a quiet beat and within the DROP ceiling", () => {
    expect([
      ENGAGE_BEAT_DURATION_MS > QUIET_BEAT_DURATION_MS,
      ENGAGE_BEAT_DURATION_MS <= DROP_BEAT_DURATION_MS,
    ]).toEqual([true, true]);
  });

  it("BD3: a turn-start ability beat gets its own duration, shorter than a quiet beat (so within the DROP ceiling)", () => {
    expect([
      beatDurationMs("TURN_START_ABILITY"),
      TURN_START_ABILITY_BEAT_DURATION_MS < QUIET_BEAT_DURATION_MS,
    ]).toEqual([TURN_START_ABILITY_BEAT_DURATION_MS, true]);
  });

  it("BD4: only a turn-start ability beat plays the quick caster pulse", () => {
    expect([
      abilityCasterPulseKind("TURN_START_ABILITY"),
      abilityCasterPulseKind("ABILITY"),
      abilityCasterPulseKind(undefined),
    ]).toEqual(["quick", "normal", "normal"]);
  });
});

describe("autoplayBeatDelayMs", () => {
  const BEAT_TYPES_FOR_DELAY = [
    "BATTLE_START",
    "ENGAGE",
    "CLASH",
    "ABILITY",
    "DROP",
    "TURN_START_ABILITY",
    undefined,
  ] as const;

  it("AD-F: at Fast, autoplay waits each beat's own duration", () => {
    expect(
      BEAT_TYPES_FOR_DELAY.map((beatType) =>
        autoplayBeatDelayMs(beatType, "fast"),
      ),
    ).toEqual(BEAT_TYPES_FOR_DELAY.map((beatType) => beatDurationMs(beatType)));
  });

  // deliberate assertion rewrite: Slow is stated relative to each beat's duration (before: the literal [1600, 1800, 1600, 1600, 2200, 600, 800]; after: beatDurationMs × the multiplier), so the animation tempo can be tuned without editing tests; BD-T pins the base values — Phase 15
  it("AD-S: at Slow, autoplay waits each beat's duration times the slow multiplier (2)", () => {
    expect(SLOW_AUTOPLAY_BEAT_DURATION_MULTIPLIER).toBe(2);
    expect(
      BEAT_TYPES_FOR_DELAY.map((beatType) =>
        autoplayBeatDelayMs(beatType, "slow"),
      ),
    ).toEqual(
      BEAT_TYPES_FOR_DELAY.map(
        (beatType) => beatDurationMs(beatType) * SLOW_AUTOPLAY_BEAT_DURATION_MULTIPLIER,
      ),
    );
  });
});

describe("beat durations at the animation tempo", () => {
  it("BD-T: every beat is its base duration scaled by the animation tempo", () => {
    expect([
      EVENTFUL_BEAT_DURATION_MS,
      QUIET_BEAT_DURATION_MS,
      DROP_BEAT_DURATION_MS,
      PREPARE_BEAT_DURATION_MS,
      ENGAGE_BEAT_DURATION_MS,
      TURN_START_ABILITY_BEAT_DURATION_MS,
    ]).toEqual([
      animationTempoMs(800),
      animationTempoMs(400),
      animationTempoMs(1100),
      animationTempoMs(800),
      animationTempoMs(900),
      animationTempoMs(300),
    ]);
  });
});
