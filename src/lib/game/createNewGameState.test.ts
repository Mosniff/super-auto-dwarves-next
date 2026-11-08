import { describe, it, expect } from "vitest";
import { createNewGameState } from "./createNewGameState";
import type { OwnedCharacter } from "./ownedCharacter";
import { CAMP_ROSTER_SLOT_COUNT } from "./campRoster";

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

  it("(d) returns a player camp roster of seven empty slots and no purchased listings", () => {
    const newGameState = createNewGameState();

    expect(newGameState.playerRoster).toEqual(
      Array.from({ length: CAMP_ROSTER_SLOT_COUNT }, () => null),
    );
    expect(newGameState.purchasedShopListingIds).toEqual([]);
  });

  it("(e) returns an independent object on each call", () => {
    const firstGameState = createNewGameState();
    const secondGameState = createNewGameState();

    const fixtureCharacter: OwnedCharacter = {
      id: "fixture-dwarf-1",
      name: "Fixture Dwarf",
      attack: 3,
      hp: 5,
      maxHp: 5,
      characterTemplateId: "fixture-dwarf",
      tier: 1,
      characterClassIds: ["warrior"],
    };
    firstGameState.playerRoster[0] = fixtureCharacter;

    expect(secondGameState.playerRoster).toEqual(
      Array.from({ length: CAMP_ROSTER_SLOT_COUNT }, () => null),
    );
  });
});
