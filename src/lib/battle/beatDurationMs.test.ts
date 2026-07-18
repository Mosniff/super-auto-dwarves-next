import { describe, it, expect } from "vitest";
import {
  beatDurationMs,
  EVENTFUL_BEAT_DURATION_MS,
  QUIET_BEAT_DURATION_MS,
} from "./beatDurationMs";

describe("beatDurationMs", () => {
  it("returns the eventful duration for a CLASH beat", () => {
    expect(beatDurationMs("CLASH")).toBe(EVENTFUL_BEAT_DURATION_MS);
  });

  it("returns the eventful duration for a DROP beat", () => {
    expect(beatDurationMs("DROP")).toBe(EVENTFUL_BEAT_DURATION_MS);
  });

  it("returns the quiet duration for a TURN_START beat", () => {
    expect(beatDurationMs("TURN_START")).toBe(QUIET_BEAT_DURATION_MS);
  });

  it("returns the quiet duration for a BATTLE_START beat", () => {
    expect(beatDurationMs("BATTLE_START")).toBe(QUIET_BEAT_DURATION_MS);
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

  it("both durations are at most 800ms", () => {
    expect(EVENTFUL_BEAT_DURATION_MS).toBeLessThanOrEqual(800);
    expect(QUIET_BEAT_DURATION_MS).toBeLessThanOrEqual(800);
  });
});
