import { describe, it, expect } from "vitest";
import { buildCharacterLabelMap } from "./buildCharacterLabelMap";
import { buildTestCharacter } from "@/test/characterFixtures";
import type { BattleState } from "./types";

const fixtureInitialState: BattleState = {
  player: {
    activeCharacters: [buildTestCharacter({ id: "p1", name: "Borin" })],
    downedCharacters: [buildTestCharacter({ id: "p2", name: "Thrudi" })],
  },
  enemy: {
    activeCharacters: [buildTestCharacter({ id: "e1", name: "Grukk" })],
    downedCharacters: [buildTestCharacter({ id: "e2", name: "Snik" })],
  },
};

describe("buildCharacterLabelMap", () => {
  it("CL1: labels every character, active and downed, with its name and its side", () => {
    expect([...buildCharacterLabelMap(fixtureInitialState).entries()]).toEqual([
      ["p1", { name: "Borin", side: "player" }],
      ["p2", { name: "Thrudi", side: "player" }],
      ["e1", { name: "Grukk", side: "enemy" }],
      ["e2", { name: "Snik", side: "enemy" }],
    ]);
  });

  it("CL2: returns an empty map for empty rosters", () => {
    const emptyInitialState: BattleState = {
      player: { activeCharacters: [], downedCharacters: [] },
      enemy: { activeCharacters: [], downedCharacters: [] },
    };

    expect([...buildCharacterLabelMap(emptyInitialState).entries()]).toEqual(
      [],
    );
  });

  it("CL3: uses the injected display name and keeps each side", () => {
    expect([
      ...buildCharacterLabelMap(
        fixtureInitialState,
        (character) => `${character.name} (shown)`,
      ).entries(),
    ]).toEqual([
      ["p1", { name: "Borin (shown)", side: "player" }],
      ["p2", { name: "Thrudi (shown)", side: "player" }],
      ["e1", { name: "Grukk (shown)", side: "enemy" }],
      ["e2", { name: "Snik (shown)", side: "enemy" }],
    ]);
  });
});
