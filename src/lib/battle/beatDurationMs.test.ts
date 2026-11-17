import { describe, it, expect } from "vitest";
import {
  beatDurationMs,
  DROP_BEAT_DURATION_MS,
  EVENTFUL_BEAT_DURATION_MS,
  PREPARE_BEAT_DURATION_MS,
  QUIET_BEAT_DURATION_MS,
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
});
