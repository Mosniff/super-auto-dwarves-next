import { describe, it, expect } from "vitest";
import { buildNameMap } from "./buildNameMap";
import { buildTestCharacter } from "@/test/characterFixtures";
import type { BattleState } from "./types";

describe("buildNameMap", () => {
  it("maps every character id to its name across both sides", () => {
    const initialState: BattleState = {
      player: {
        activeCharacters: [
          buildTestCharacter({ id: "p1", name: "Borin", attack: 4, hp: 7, maxHp: 7, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
          buildTestCharacter({ id: "p2", name: "Thrudi", attack: 6, hp: 5, maxHp: 5, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
        ],
        downedCharacters: [],
      },
      enemy: {
        activeCharacters: [buildTestCharacter({ id: "e1", name: "Grukk", attack: 5, hp: 6, maxHp: 6, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 })],
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
