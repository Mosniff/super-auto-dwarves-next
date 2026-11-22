// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  AUTOPLAY_SPEED_STORAGE_KEY,
  readAutoplaySpeedPreference,
  writeAutoplaySpeedPreference,
} from "./autoplaySpeedPreference";

describe("autoplaySpeedPreference", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("PR1: a written speed is read back, under the documented key", () => {
    writeAutoplaySpeedPreference("slow");

    expect([
      readAutoplaySpeedPreference(),
      window.localStorage.getItem(AUTOPLAY_SPEED_STORAGE_KEY),
    ]).toEqual(["slow", "slow"]);
  });

  it("PR2: with nothing stored, the preference is off", () => {
    expect(readAutoplaySpeedPreference()).toBe("off");
  });

  it("PR3: when storage throws, reading gives off and writing does not throw", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Fixture storage failure.");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Fixture storage failure.");
    });

    expect([
      readAutoplaySpeedPreference(),
      (() => {
        writeAutoplaySpeedPreference("fast");
        return "no throw";
      })(),
    ]).toEqual(["off", "no throw"]);
  });
});
