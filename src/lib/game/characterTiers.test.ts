import { describe, it, expect } from "vitest";
import { isCharacterTier } from "./characterTiers";

describe("characterTiers", () => {
  it("T1: isCharacterTier accepts every tier 1 through 5", () => {
    expect([1, 2, 3, 4, 5].map(isCharacterTier)).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
  });

  it("T2: isCharacterTier rejects non-tier values", () => {
    expect(
      [0, 6, -1, 1.5, Number.NaN, "1", null, undefined].map(isCharacterTier),
    ).toEqual([false, false, false, false, false, false, false, false]);
  });
});
