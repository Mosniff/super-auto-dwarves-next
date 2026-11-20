import { describe, it, expect } from "vitest";
import { requiresHumanCheck } from "./requiresHumanCheck";

describe("requiresHumanCheck", () => {
  it("(a) requires the check when there is no session", async () => {
    expect(await requiresHumanCheck(async () => null)).toBe(true);
  });

  it("(b) does not require the check when a session exists", async () => {
    expect(
      await requiresHumanCheck(async () => "fixture-existing-user-id"),
    ).toBe(false);
  });

  it("(c) requires the check when the session read throws", async () => {
    expect(
      await requiresHumanCheck(async () => {
        throw new Error("Fixture session read failure.");
      }),
    ).toBe(true);
  });
});
