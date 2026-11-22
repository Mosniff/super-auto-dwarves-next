import { describe, it, expect } from "vitest";
import { parseAutoplaySpeed } from "./autoplaySpeed";

describe("parseAutoplaySpeed", () => {
  it("AP1: reads each stored speed back", () => {
    expect(["off", "slow", "fast"].map(parseAutoplaySpeed)).toEqual([
      "off",
      "slow",
      "fast",
    ]);
  });

  it("AP2: anything else, or nothing stored, means off", () => {
    expect([null, "", "FAST", "medium", "1"].map(parseAutoplaySpeed)).toEqual([
      "off",
      "off",
      "off",
      "off",
      "off",
    ]);
  });
});
