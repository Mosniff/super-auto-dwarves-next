import { describe, it, expect } from "vitest";
import { tierRomanNumeral } from "./characterCardDisplay";

describe("characterCardDisplay", () => {
  it("T1: converts each tier to its Roman numeral", () => {
    expect(([1, 2, 3, 4, 5] as const).map(tierRomanNumeral)).toEqual([
      "I",
      "II",
      "III",
      "IV",
      "V",
    ]);
  });
});
