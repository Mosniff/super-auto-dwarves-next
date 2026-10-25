import { describe, it, expect } from "vitest";
import { isGamePhase } from "./isGamePhase";

describe("isGamePhase", () => {
  it("(a) returns true for campPhase", () => {
    expect(isGamePhase("campPhase")).toBe(true);
  });

  it("(b) returns true for battlePhase", () => {
    expect(isGamePhase("battlePhase")).toBe(true);
  });

  it("(c) returns false for non-phase values", () => {
    const nonPhaseValues: unknown[] = [
      "adventurePhase",
      "",
      null,
      undefined,
      42,
      {},
    ];

    for (const nonPhaseValue of nonPhaseValues) {
      expect(isGamePhase(nonPhaseValue)).toBe(false);
    }
  });
});
