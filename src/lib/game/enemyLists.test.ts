import { describe, it, expect } from "vitest";
import { chooseEnemyListIdForDepth } from "./enemyLists";

const fixtureBreakpoints = [
  { fromDepth: 1, enemyListId: "first-list" },
  { fromDepth: 4, enemyListId: "second-list" },
  { fromDepth: 9, enemyListId: "third-list" },
];

describe("chooseEnemyListIdForDepth", () => {
  it("EL1: picks the last breakpoint at or below the depth; the last is open-ended", () => {
    expect(
      [1, 3, 4, 8, 9, 50].map((depth) =>
        chooseEnemyListIdForDepth(depth, fixtureBreakpoints),
      ),
    ).toEqual([
      "first-list",
      "first-list",
      "second-list",
      "second-list",
      "third-list",
      "third-list",
    ]);
  });

  it("EL2: throws when no breakpoint covers the depth", () => {
    expect(
      [
        () => chooseEnemyListIdForDepth(0, fixtureBreakpoints),
        () => chooseEnemyListIdForDepth(3, []),
      ].map((choose) => {
        try {
          choose();
          return false;
        } catch {
          return true;
        }
      }),
    ).toEqual([true, true]);
  });
});
