import { describe, it, expect } from "vitest";
import { createNewGameState } from "./createNewGameState";
import type { OwnedCharacter } from "./ownedCharacter";
import { CAMP_ROSTER_SLOT_COUNT } from "./campRoster";
import {
  buildFixtureCharacterShopRollingSources,
  buildOfferingCharacterShopSlot,
  LOCKED_CHARACTER_SHOP_SLOT,
} from "@/test/characterShopFixtures";

describe("createNewGameState", () => {
  it("(a) returns a game in campPhase", () => {
    const newGameState = createNewGameState(
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

    expect(newGameState.phase).toBe("campPhase");
  });

  it("(b) returns day 1", () => {
    const newGameState = createNewGameState(
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

    expect(newGameState.day).toBe(1);
  });

  it("(c) returns 10 gold", () => {
    const newGameState = createNewGameState(
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

    expect(newGameState.gold).toBe(10);
  });

  it("(d) returns a player camp roster of seven empty slots", () => {
    const newGameState = createNewGameState(
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

    expect(newGameState.playerRoster).toEqual(
      Array.from({ length: CAMP_ROSTER_SLOT_COUNT }, () => null),
    );
  });

  it("(e) returns an independent object on each call", () => {
    const firstGameState = createNewGameState(
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );
    const secondGameState = createNewGameState(
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

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

  it("N1: rolls the starting character shop", () => {
    const { characterShopRollingSources, recordedOptionCounts } =
      buildFixtureCharacterShopRollingSources([1, 0, 1]);

    const newGameState = createNewGameState(characterShopRollingSources);

    expect(newGameState.characterShopSlots).toEqual([
      buildOfferingCharacterShopSlot("fixture-dwarf-two"),
      buildOfferingCharacterShopSlot("fixture-dwarf-one"),
      buildOfferingCharacterShopSlot("fixture-dwarf-two"),
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
    ]);
    expect(recordedOptionCounts).toEqual([2, 2, 2]);
  });
});
