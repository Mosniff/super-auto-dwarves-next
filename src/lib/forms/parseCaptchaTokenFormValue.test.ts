import { describe, it, expect } from "vitest";
import { parseCaptchaTokenFormValue } from "./parseCaptchaTokenFormValue";

describe("parseCaptchaTokenFormValue", () => {
  it("(a) returns a non-empty token string unchanged", () => {
    expect(["fixture-captcha-token"].map(parseCaptchaTokenFormValue)).toEqual([
      "fixture-captcha-token",
    ]);
  });

  it("(b) returns undefined for an empty string", () => {
    expect([""].map(parseCaptchaTokenFormValue)).toEqual([undefined]);
  });

  it("(c) returns undefined for a missing field or a file", () => {
    expect(
      [null, new File(["token"], "token.txt")].map(parseCaptchaTokenFormValue),
    ).toEqual([undefined, undefined]);
  });
});
