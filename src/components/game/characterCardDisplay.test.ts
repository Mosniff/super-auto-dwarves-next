import { describe, it, expect } from "vitest";
import { hpDisplayTone, tierRomanNumeral } from "./characterCardDisplay";

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

  it("(a) hpDisplayTone(3, 7) is damaged", () => {
    expect(hpDisplayTone(3, 7)).toBe("damaged");
  });

  it("(b) hpDisplayTone(7, 7) is full", () => {
    expect(hpDisplayTone(7, 7)).toBe("full");
  });

  it("(c) hpDisplayTone(9, 7) is buffed", () => {
    expect(hpDisplayTone(9, 7)).toBe("buffed");
  });
});
