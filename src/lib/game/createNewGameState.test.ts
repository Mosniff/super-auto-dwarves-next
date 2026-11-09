import { describe, it, expect } from "vitest";
import { createNewGameState } from "./createNewGameState";
import type { OwnedCharacter } from "./ownedCharacter";
import { CAMP_ROSTER_SLOT_COUNT } from "./campRoster";
import {
  buildFixtureShopRollingSources,
  buildOfferingShopSlot,
  LOCKED_SHOP_SLOT,
} from "@/test/shopFixtures";

describe("createNewGameState", () => {
  it("(a) returns a game in campPhase", () => {
    const newGameState = createNewGameState(
      buildFixtureShopRollingSources().shopRollingSources,
    );

    expect(newGameState.phase).toBe("campPhase");
  });

  it("(b) returns day 1", () => {
    const newGameState = createNewGameState(
      buildFixtureShopRollingSources().shopRollingSources,
    );

    expect(newGameState.day).toBe(1);
  });

  it("(c) returns 10 gold", () => {
    const newGameState = createNewGameState(
      buildFixtureShopRollingSources().shopRollingSources,
    );

    expect(newGameState.gold).toBe(10);
  });

  it("(d) returns a player camp roster of seven empty slots and no purchased listings", () => {
    const newGameState = createNewGameState(
      buildFixtureShopRollingSources().shopRollingSources,
    );

    expect(newGameState.playerRoster).toEqual(
      Array.from({ length: CAMP_ROSTER_SLOT_COUNT }, () => null),
    );
    expect(newGameState.purchasedShopListingIds).toEqual([]);
  });

  it("(e) returns an independent object on each call", () => {
    const firstGameState = createNewGameState(
      buildFixtureShopRollingSources().shopRollingSources,
    );
    const secondGameState = createNewGameState(
      buildFixtureShopRollingSources().shopRollingSources,
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

  it("N1: rolls the starting shop", () => {
    const { shopRollingSources, recordedOptionCounts } =
      buildFixtureShopRollingSources([1, 0, 1]);

    const newGameState = createNewGameState(shopRollingSources);

    expect(newGameState.shopSlots).toEqual([
      buildOfferingShopSlot("fixture-dwarf-two"),
      buildOfferingShopSlot("fixture-dwarf-one"),
      buildOfferingShopSlot("fixture-dwarf-two"),
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
    ]);
    expect(recordedOptionCounts).toEqual([2, 2, 2]);
  });
});
