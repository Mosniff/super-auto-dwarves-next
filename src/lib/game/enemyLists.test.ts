import { describe, it, expect } from "vitest";
import { findCharacterTemplate } from "./characterTemplates";
import {
  chooseEnemyListIdForDepth,
  ENEMY_LIST_DEPTH_BREAKPOINTS,
  ENEMY_LISTS,
  findEnemyList,
} from "./enemyLists";

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

  it("EL3: the kobold list and the depth table are the human's design", () => {
    expect({
      enemyLists: ENEMY_LISTS,
      depthBreakpoints: ENEMY_LIST_DEPTH_BREAKPOINTS,
    }).toEqual({
      enemyLists: {
        kobolds: {
          enemyListId: "kobolds",
          enemyFactionId: "kobold",
          entries: [
            { characterTemplateId: "kobold-runt", cost: 1, position: 1 },
            { characterTemplateId: "kobold-thief", cost: 2, position: 2 },
          ],
        },
      },
      depthBreakpoints: [{ fromDepth: 1, enemyListId: "kobolds" }],
    });
  });

  // A guard over hand-written list data, like the template guards.
  it("EL4: every list and breakpoint is well formed", () => {
    const listProblems = Object.entries(ENEMY_LISTS).flatMap(
      ([enemyListKey, enemyList]) => {
        const positions = enemyList.entries.map((entry) => entry.position);
        const problems: string[] = [];

        if (enemyListKey !== enemyList.enemyListId) {
          problems.push(`${enemyListKey}: keyed by another id`);
        }
        if (new Set(positions).size !== positions.length) {
          problems.push(`${enemyListKey}: duplicate positions`);
        }
        for (const entry of enemyList.entries) {
          const characterTemplate = findCharacterTemplate(
            entry.characterTemplateId,
          );
          if (characterTemplate === undefined) {
            problems.push(`${enemyListKey}: unknown ${entry.characterTemplateId}`);
          } else if (
            characterTemplate.characterFactionId !== enemyList.enemyFactionId
          ) {
            problems.push(`${enemyListKey}: ${entry.characterTemplateId} is another faction`);
          }
          if (!Number.isInteger(entry.cost) || entry.cost < 1) {
            problems.push(`${enemyListKey}: ${entry.characterTemplateId} has a bad cost`);
          }
        }

        return problems;
      },
    );
    const breakpointDepths = ENEMY_LIST_DEPTH_BREAKPOINTS.map(
      (breakpoint) => breakpoint.fromDepth,
    );
    const breakpointProblems = [
      ...(breakpointDepths[0] === 1 ? [] : ["the table must start at depth 1"]),
      ...breakpointDepths
        .slice(1)
        .filter((fromDepth, index) => fromDepth <= breakpointDepths[index])
        .map((fromDepth) => `depth ${fromDepth} is out of order`),
      ...ENEMY_LIST_DEPTH_BREAKPOINTS.filter(
        (breakpoint) => !Object.hasOwn(ENEMY_LISTS, breakpoint.enemyListId),
      ).map((breakpoint) => `unknown list ${breakpoint.enemyListId}`),
    ];

    expect({ listProblems, breakpointProblems }).toEqual({
      listProblems: [],
      breakpointProblems: [],
    });
  });

  it("EL5: findEnemyList throws for an unknown list id", () => {
    expect(() => findEnemyList("no-such-list")).toThrow();
  });
});
