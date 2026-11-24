import { describe, it, expect } from "vitest";
import {
  ANIMATION_TEMPO,
  animationTempoMs,
  animationTempoSeconds,
} from "./animationTempo";

describe("animation tempo", () => {
  it("AT1: the tempo is 1.25 (the human's setting: everything 25% slower)", () => {
    expect(ANIMATION_TEMPO).toBe(1.25);
  });

  it("AT2: a base time in milliseconds is scaled by the tempo and rounded to a whole millisecond", () => {
    expect([
      animationTempoMs(800),
      animationTempoMs(550),
      Number.isInteger(animationTempoMs(550)),
    ]).toEqual([
      Math.round(800 * ANIMATION_TEMPO),
      Math.round(550 * ANIMATION_TEMPO),
      true,
    ]);
  });

  it("AT3: a base time in seconds is scaled by the tempo", () => {
    expect(animationTempoSeconds(0.4)).toBeCloseTo(0.4 * ANIMATION_TEMPO);
  });
});
