import { describe, it, expect } from "vitest";
import { hpBarFillRatio } from "./hpBarFillRatio";

describe("hpBarFillRatio", () => {
  it("returns a normal fraction", () => {
    expect(hpBarFillRatio(7, 10)).toBe(0.7);
  });

  it("returns 1 at full health", () => {
    expect(hpBarFillRatio(10, 10)).toBe(1);
  });

  it("returns 0 at zero hp", () => {
    expect(hpBarFillRatio(0, 10)).toBe(0);
  });

  it("clamps negative current hp to 0", () => {
    expect(hpBarFillRatio(-3, 10)).toBe(0);
  });

  it("clamps current hp above max to 1", () => {
    expect(hpBarFillRatio(12, 10)).toBe(1);
  });

  it("returns 0 for a maxHp of 0, not NaN or Infinity", () => {
    expect(hpBarFillRatio(0, 0)).toBe(0);
    expect(hpBarFillRatio(5, 0)).toBe(0);
  });
});
