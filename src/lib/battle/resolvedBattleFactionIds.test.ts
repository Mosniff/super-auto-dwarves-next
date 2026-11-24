import { describe, it, expect } from "vitest";
import { buildTestCharacter } from "@/test/characterFixtures";
import { resolveBattle } from "./resolveBattle";
import { resolvedBattleFactionIds } from "./resolvedBattleFactionIds";

describe("resolvedBattleFactionIds", () => {
  it("RF1: reads both sides' factions from the battle's start event", () => {
    const resolvedBattle = resolveBattle(
      [buildTestCharacter({ id: "p1" })],
      [buildTestCharacter({ id: "e1" })],
      20,
      undefined,
      { playerFactionId: "dwarf", enemyFactionId: "kobold" },
    );

    expect(resolvedBattleFactionIds(resolvedBattle)).toEqual({
      playerFactionId: "dwarf",
      enemyFactionId: "kobold",
    });
  });

  it("RF2: a battle with no start event has no factions", () => {
    expect(
      resolvedBattleFactionIds({
        initialState: resolveBattle([], []).initialState,
        events: [],
      }),
    ).toBeUndefined();
  });
});
