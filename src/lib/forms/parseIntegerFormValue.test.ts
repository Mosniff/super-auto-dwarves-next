import { describe, it, expect } from "vitest";
import { parseIntegerFormValue } from "./parseIntegerFormValue";

describe("parseIntegerFormValue", () => {
  it("(a) parses plain integer strings", () => {
    expect(["0", "3", "6", "-1"].map(parseIntegerFormValue)).toEqual([
      0, 3, 6, -1,
    ]);
  });

  it("(b) returns null for decimal, exponent or padded numbers", () => {
    expect(["1.5", "1e2", " 3", "3 "].map(parseIntegerFormValue)).toEqual([
      null,
      null,
      null,
      null,
    ]);
  });

  it("(c) returns null for empty or non-numeric strings", () => {
    expect(["", "abc", "-"].map(parseIntegerFormValue)).toEqual([
      null,
      null,
      null,
    ]);
  });

  it("(d) returns null for a missing field or a file", () => {
    expect(
      [null, new File(["3"], "three.txt")].map(parseIntegerFormValue),
    ).toEqual([null, null]);
  });
});
