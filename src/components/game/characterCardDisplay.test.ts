import { describe, it, expect } from "vitest";
import {
  experienceBarCaption,
  experienceBarSegments,
  hpDisplayTone,
  tierRomanNumeral,
} from "./characterCardDisplay";

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

  it("(d) experienceBarSegments splits each level into its own chunk, and is full at max level", () => {
    const experienceValues = [0, 2, 3, 6, 9, 10, 14, 15];

    expect(experienceValues.map(experienceBarSegments)).toEqual([
      { segmentCount: 3, filledSegmentCount: 0, isMaxLevel: false },
      { segmentCount: 3, filledSegmentCount: 2, isMaxLevel: false },
      { segmentCount: 3, filledSegmentCount: 0, isMaxLevel: false },
      { segmentCount: 4, filledSegmentCount: 0, isMaxLevel: false },
      { segmentCount: 4, filledSegmentCount: 3, isMaxLevel: false },
      { segmentCount: 5, filledSegmentCount: 0, isMaxLevel: false },
      { segmentCount: 5, filledSegmentCount: 4, isMaxLevel: false },
      { segmentCount: 5, filledSegmentCount: 5, isMaxLevel: true },
    ]);
  });

  it("(e) experienceBarCaption gives the XP remaining and the next level, or max level", () => {
    const experienceValues = [0, 4, 9, 14, 15];

    expect(experienceValues.map(experienceBarCaption)).toEqual([
      { progressKind: "levelling", experienceRemaining: 3, nextLevel: 2 },
      { progressKind: "levelling", experienceRemaining: 2, nextLevel: 3 },
      { progressKind: "levelling", experienceRemaining: 1, nextLevel: 4 },
      { progressKind: "levelling", experienceRemaining: 1, nextLevel: 5 },
      { progressKind: "maxLevel" },
    ]);
  });
});
