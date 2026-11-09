import { describe, it, expect } from "vitest";
import { advanceGame } from "./advanceGame";
import type { GamePhase, GameState } from "./types";
import type { OwnedCharacter } from "./ownedCharacter";
import type { CampRoster } from "./campRoster";
import { CAMP_STARTING_GOLD } from "./campState";
import {
  buildFixtureShopRollingSources,
  buildFixtureShopSlots,
  buildOfferingShopSlot,
  LOCKED_SHOP_SLOT,
  SOLD_SHOP_SLOT,
} from "@/test/shopFixtures";

// Arbitrary fixture value — starting gold is not yet specified.
const FIXTURE_GOLD = 10;

function buildFixtureCampRoster(): CampRoster {
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

  return [fixtureCharacter, null, null, null, null, null, null];
}

function buildFixtureGameState(
  phase: GamePhase,
  day: number,
  overrides: Partial<GameState> = {},
): GameState {
  return {
    playerRoster: buildFixtureCampRoster(),
    gold: FIXTURE_GOLD,
    day,
    phase,
    purchasedShopListingIds: [],
    shopSlots: buildFixtureShopSlots(),
    ...overrides,
  };
}

describe("advanceGame", () => {
  it("moves a campPhase game into battlePhase without changing the day", () => {
    const campPhaseGameState = buildFixtureGameState("campPhase", 1);

    const nextGameState = advanceGame(
      campPhaseGameState,
      buildFixtureShopRollingSources().shopRollingSources,
    );

    expect(nextGameState.phase).toBe("battlePhase");
    expect(nextGameState.day).toBe(1);
  });

  it("moves a battlePhase game back to campPhase and increments the day", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1);

    const nextGameState = advanceGame(
      battlePhaseGameState,
      buildFixtureShopRollingSources().shopRollingSources,
    );

    expect(nextGameState.phase).toBe("campPhase");
    expect(nextGameState.day).toBe(2);
  });

  it("carries the roster, gold and purchased listings into battle, and the roster back to camp", () => {
    const campPhaseGameState = buildFixtureGameState("campPhase", 1, {
      purchasedShopListingIds: ["fixture-listing-1"],
    });
    const nextFromCampPhase = advanceGame(
      campPhaseGameState,
      buildFixtureShopRollingSources().shopRollingSources,
    );

    expect(nextFromCampPhase.playerRoster).toEqual(
      campPhaseGameState.playerRoster,
    );
    expect(nextFromCampPhase.gold).toBe(campPhaseGameState.gold);
    expect(nextFromCampPhase.purchasedShopListingIds).toEqual(
      campPhaseGameState.purchasedShopListingIds,
    );

    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1);
    const nextFromBattlePhase = advanceGame(
      battlePhaseGameState,
      buildFixtureShopRollingSources().shopRollingSources,
    );

    expect(nextFromBattlePhase.playerRoster).toEqual(
      battlePhaseGameState.playerRoster,
    );
  });

  it("sets gold to CAMP_STARTING_GOLD when returning to camp, discarding unspent gold", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1, {
      gold: 4,
    });

    const nextGameState = advanceGame(
      battlePhaseGameState,
      buildFixtureShopRollingSources().shopRollingSources,
    );

    expect(nextGameState.gold).toBe(CAMP_STARTING_GOLD);
  });

  it("sets gold to CAMP_STARTING_GOLD when returning to camp with no gold left", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1, {
      gold: 0,
    });

    const nextGameState = advanceGame(
      battlePhaseGameState,
      buildFixtureShopRollingSources().shopRollingSources,
    );

    expect(nextGameState.gold).toBe(CAMP_STARTING_GOLD);
  });

  it("clears purchased listings when returning to camp", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1, {
      purchasedShopListingIds: ["fixture-listing-1", "fixture-listing-2"],
    });

    const nextGameState = advanceGame(
      battlePhaseGameState,
      buildFixtureShopRollingSources().shopRollingSources,
    );

    expect(nextGameState.purchasedShopListingIds).toEqual([]);
  });

  it("does not mutate the input game state", () => {
    const campPhaseGameState = buildFixtureGameState("campPhase", 1);
    const campPhaseGameStateClone = structuredClone(campPhaseGameState);
    advanceGame(
      campPhaseGameState,
      buildFixtureShopRollingSources().shopRollingSources,
    );
    expect(campPhaseGameState).toEqual(campPhaseGameStateClone);

    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1);
    const battlePhaseGameStateClone = structuredClone(battlePhaseGameState);
    advanceGame(
      battlePhaseGameState,
      buildFixtureShopRollingSources().shopRollingSources,
    );
    expect(battlePhaseGameState).toEqual(battlePhaseGameStateClone);
  });

  it("a new game advanced through two full loops ends in campPhase on day 3", () => {
    const newGameState = buildFixtureGameState("campPhase", 1);

    const afterFirstAdvance = advanceGame(
      newGameState,
      buildFixtureShopRollingSources().shopRollingSources,
    );
    const afterSecondAdvance = advanceGame(
      afterFirstAdvance,
      buildFixtureShopRollingSources().shopRollingSources,
    );
    const afterThirdAdvance = advanceGame(
      afterSecondAdvance,
      buildFixtureShopRollingSources().shopRollingSources,
    );
    const afterFourthAdvance = advanceGame(
      afterThirdAdvance,
      buildFixtureShopRollingSources().shopRollingSources,
    );

    expect(afterFourthAdvance.phase).toBe("campPhase");
    expect(afterFourthAdvance.day).toBe(3);
  });

  it("A1: re-rolls the shop when returning to camp, keeping the open-slot count", () => {
    const campPhaseGameState = buildFixtureGameState("campPhase", 1);
    const { shopRollingSources, recordedOptionCounts } =
      buildFixtureShopRollingSources();

    const nextGameState = advanceGame(campPhaseGameState, shopRollingSources);

    expect(nextGameState.shopSlots).toEqual(buildFixtureShopSlots());
    expect(recordedOptionCounts).toEqual([]);
  });

  it("A2: re-rolls every open slot (sold or offering), keeping the open-slot count", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1, {
      shopSlots: [
        SOLD_SHOP_SLOT,
        buildOfferingShopSlot("fixture-dwarf-one"),
        buildOfferingShopSlot("fixture-dwarf-two"),
        LOCKED_SHOP_SLOT,
        LOCKED_SHOP_SLOT,
        LOCKED_SHOP_SLOT,
        LOCKED_SHOP_SLOT,
        LOCKED_SHOP_SLOT,
      ],
    });
    const { shopRollingSources, recordedOptionCounts } =
      buildFixtureShopRollingSources([0, 1, 0]);

    const nextGameState = advanceGame(battlePhaseGameState, shopRollingSources);

    expect(nextGameState.shopSlots).toEqual([
      buildOfferingShopSlot("fixture-dwarf-one"),
      buildOfferingShopSlot("fixture-dwarf-two"),
      buildOfferingShopSlot("fixture-dwarf-one"),
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
    ]);
    expect(recordedOptionCounts).toEqual([2, 2, 2]);
  });

  it("A3: re-rolls all sold slots when every slot was open", () => {
    const battlePhaseGameState = buildFixtureGameState("battlePhase", 1, {
      shopSlots: [
        SOLD_SHOP_SLOT,
        SOLD_SHOP_SLOT,
        SOLD_SHOP_SLOT,
        SOLD_SHOP_SLOT,
        LOCKED_SHOP_SLOT,
        LOCKED_SHOP_SLOT,
        LOCKED_SHOP_SLOT,
        LOCKED_SHOP_SLOT,
      ],
    });
    const { shopRollingSources, recordedOptionCounts } =
      buildFixtureShopRollingSources([]);

    const nextGameState = advanceGame(battlePhaseGameState, shopRollingSources);

    expect(nextGameState.shopSlots).toEqual([
      buildOfferingShopSlot("fixture-dwarf-one"),
      buildOfferingShopSlot("fixture-dwarf-one"),
      buildOfferingShopSlot("fixture-dwarf-one"),
      buildOfferingShopSlot("fixture-dwarf-one"),
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
    ]);
    expect(recordedOptionCounts).toEqual([2, 2, 2, 2]);
  });
});
