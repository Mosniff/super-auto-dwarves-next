import { describe, it, expect } from "vitest";
import { buildNameMap } from "./buildNameMap";
import type { BattleState } from "./types";

describe("buildNameMap", () => {
  it("maps every character id to its name across both sides", () => {
    const initialState: BattleState = {
      player: {
        activeCharacters: [
          { id: "p1", name: "Borin", attack: 4, hp: 7, maxHp: 7 },
          { id: "p2", name: "Thrudi", attack: 6, hp: 5, maxHp: 5 },
        ],
        downedCharacters: [],
      },
      enemy: {
        activeCharacters: [{ id: "e1", name: "Grukk", attack: 5, hp: 6, maxHp: 6 }],
        downedCharacters: [],
      },
    };

    const nameMap = buildNameMap(initialState);

    expect(nameMap.size).toBe(3);
    expect(nameMap.get("p1")).toBe("Borin");
    expect(nameMap.get("p2")).toBe("Thrudi");
    expect(nameMap.get("e1")).toBe("Grukk");
  });

  it("returns an empty map for empty rosters", () => {
    const initialState: BattleState = {
      player: { activeCharacters: [], downedCharacters: [] },
      enemy: { activeCharacters: [], downedCharacters: [] },
    };

    const nameMap = buildNameMap(initialState);

    expect(nameMap.size).toBe(0);
  });
});
