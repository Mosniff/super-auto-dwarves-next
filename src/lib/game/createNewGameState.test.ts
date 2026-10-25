import { describe, it, expect } from "vitest";
import { createNewGameState } from "./createNewGameState";
import type { Character } from "@/lib/battle/types";

describe("createNewGameState", () => {
  it("(a) returns a game in campPhase", () => {
    const newGameState = createNewGameState();

    expect(newGameState.phase).toBe("campPhase");
  });

  it("(b) returns day 1", () => {
    const newGameState = createNewGameState();

    expect(newGameState.day).toBe(1);
  });

  it("(c) returns 10 gold", () => {
    const newGameState = createNewGameState();

    expect(newGameState.gold).toBe(10);
  });

  it("(d) returns a player roster with no active characters and no downed characters", () => {
    const newGameState = createNewGameState();

    expect(newGameState.playerRoster.activeCharacters).toHaveLength(0);
    expect(newGameState.playerRoster.downedCharacters).toHaveLength(0);
  });

  it("(e) returns an independent object on each call", () => {
    const firstGameState = createNewGameState();
    const secondGameState = createNewGameState();

    const fixtureCharacter: Character = {
      id: "fixture-dwarf-1",
      name: "Fixture Dwarf",
      attack: 3,
      hp: 5,
      maxHp: 5,
    };
    firstGameState.playerRoster.activeCharacters.push(fixtureCharacter);

    expect(secondGameState.playerRoster.activeCharacters).toHaveLength(0);
  });
});
