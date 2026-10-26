import { describe, it, expect } from "vitest";
import type { Character } from "@/lib/battle/types";
import { createEmptyCampRoster, type CampRoster } from "./campRoster";
import type { CampState } from "./campState";
import type { CharacterTemplate, ShopListing } from "./shop";
import { buyCharacter, type BuyCharacterResult } from "./buyCharacter";

function buildFixtureCharacter(id: string, name: string): Character {
  return {
    id,
    name,
    attack: 1,
    hp: 10,
    maxHp: 10,
  };
}

const fixtureCharacterTemplateOne: CharacterTemplate = {
  name: "Fixture Dwarf One",
  attack: 2,
  hp: 5,
  maxHp: 5,
};

const fixtureCharacterTemplateTwo: CharacterTemplate = {
  name: "Fixture Dwarf Two",
  attack: 3,
  hp: 8,
  maxHp: 8,
};

// Listings 1 and 3 share an identical character template; listing 2 has a
// different template.
const fixtureShopCatalogue: ShopListing[] = [
  {
    shopListingId: "fixture-listing-1",
    characterTemplate: fixtureCharacterTemplateOne,
  },
  {
    shopListingId: "fixture-listing-2",
    characterTemplate: fixtureCharacterTemplateTwo,
  },
  {
    shopListingId: "fixture-listing-3",
    characterTemplate: fixtureCharacterTemplateOne,
  },
];

function buildFixtureCampState(overrides: Partial<CampState> = {}): CampState {
  return {
    campRoster: createEmptyCampRoster(),
    gold: 10,
    purchasedShopListingIds: [],
    ...overrides,
  };
}

function expectAcceptedCampState(buyResult: BuyCharacterResult): CampState {
  if (buyResult.outcome !== "accepted") {
    throw new Error("expected an accepted buy");
  }

  return buyResult.nextCampState;
}

describe("buyCharacter", () => {
  it("(a) accepts a buy into an empty slot: places the new character, deducts the price and records the listing", () => {
    const campStateWithTenGold = buildFixtureCampState();

    const buyResult = buyCharacter(
      campStateWithTenGold,
      fixtureShopCatalogue,
      "fixture-listing-2",
      2,
      "new-dwarf-1",
    );

    const expectedCampRoster: CampRoster = [
      null,
      null,
      { id: "new-dwarf-1", ...fixtureCharacterTemplateTwo },
      null,
      null,
      null,
      null,
    ];

    expect(buyResult).toEqual({
      outcome: "accepted",
      nextCampState: {
        campRoster: expectedCampRoster,
        gold: 7,
        purchasedShopListingIds: ["fixture-listing-2"],
      },
    });
  });

  it("(b) accepts a buy that spends exactly all remaining gold", () => {
    const campStateWithThreeGold = buildFixtureCampState({ gold: 3 });

    const buyResult = buyCharacter(
      campStateWithThreeGold,
      fixtureShopCatalogue,
      "fixture-listing-1",
      0,
      "new-dwarf-1",
    );

    const expectedCampRoster: CampRoster = [
      { id: "new-dwarf-1", ...fixtureCharacterTemplateOne },
      null,
      null,
      null,
      null,
      null,
      null,
    ];

    expect(buyResult).toEqual({
      outcome: "accepted",
      nextCampState: {
        campRoster: expectedCampRoster,
        gold: 0,
        purchasedShopListingIds: ["fixture-listing-1"],
      },
    });
  });

  it("(c) records each listing bought in the same camp visit, in order", () => {
    const campStateWithTenGold = buildFixtureCampState();

    const firstBuyResult = buyCharacter(
      campStateWithTenGold,
      fixtureShopCatalogue,
      "fixture-listing-1",
      0,
      "new-dwarf-1",
    );
    const campStateAfterFirstBuy = expectAcceptedCampState(firstBuyResult);

    const secondBuyResult = buyCharacter(
      campStateAfterFirstBuy,
      fixtureShopCatalogue,
      "fixture-listing-2",
      1,
      "new-dwarf-2",
    );

    const expectedCampRoster: CampRoster = [
      { id: "new-dwarf-1", ...fixtureCharacterTemplateOne },
      { id: "new-dwarf-2", ...fixtureCharacterTemplateTwo },
      null,
      null,
      null,
      null,
      null,
    ];

    expect(secondBuyResult).toEqual({
      outcome: "accepted",
      nextCampState: {
        campRoster: expectedCampRoster,
        gold: 4,
        purchasedShopListingIds: ["fixture-listing-1", "fixture-listing-2"],
      },
    });
  });

  it("(d) accepts two listings that share a character template as separate characters with distinct ids", () => {
    const campStateWithTenGold = buildFixtureCampState();

    const firstBuyResult = buyCharacter(
      campStateWithTenGold,
      fixtureShopCatalogue,
      "fixture-listing-1",
      0,
      "new-dwarf-1",
    );
    const campStateAfterFirstBuy = expectAcceptedCampState(firstBuyResult);

    const secondBuyResult = buyCharacter(
      campStateAfterFirstBuy,
      fixtureShopCatalogue,
      "fixture-listing-3",
      4,
      "new-dwarf-2",
    );

    const expectedCampRoster: CampRoster = [
      { id: "new-dwarf-1", ...fixtureCharacterTemplateOne },
      null,
      null,
      null,
      { id: "new-dwarf-2", ...fixtureCharacterTemplateOne },
      null,
      null,
    ];

    expect(secondBuyResult).toEqual({
      outcome: "accepted",
      nextCampState: {
        campRoster: expectedCampRoster,
        gold: 4,
        purchasedShopListingIds: ["fixture-listing-1", "fixture-listing-3"],
      },
    });
  });

  it("(e) rejects an unknown listing id", () => {
    const campStateWithTenGold = buildFixtureCampState();

    const buyResult = buyCharacter(
      campStateWithTenGold,
      fixtureShopCatalogue,
      "nonexistent-listing",
      0,
      "new-dwarf-1",
    );

    expect(buyResult).toEqual({
      outcome: "rejected",
      rejectionReason: "unknownListing",
    });
  });

  it("(f) rejects a listing already bought this camp visit", () => {
    const campStateWithListingTwoAlreadyPurchased = buildFixtureCampState({
      purchasedShopListingIds: ["fixture-listing-2"],
    });

    const buyResult = buyCharacter(
      campStateWithListingTwoAlreadyPurchased,
      fixtureShopCatalogue,
      "fixture-listing-2",
      0,
      "new-dwarf-1",
    );

    expect(buyResult).toEqual({
      outcome: "rejected",
      rejectionReason: "listingAlreadyPurchased",
    });
  });

  it("(g) rejects a buy when gold is below the price", () => {
    const campStateWithTwoGold = buildFixtureCampState({ gold: 2 });

    const buyResult = buyCharacter(
      campStateWithTwoGold,
      fixtureShopCatalogue,
      "fixture-listing-1",
      0,
      "new-dwarf-1",
    );

    expect(buyResult).toEqual({
      outcome: "rejected",
      rejectionReason: "notEnoughGold",
    });
  });

  it("(h) rejects a buy into an occupied slot", () => {
    const preoccupiedCharacter = buildFixtureCharacter(
      "preoccupied-character",
      "Preoccupied Dwarf",
    );
    const occupiedCampRoster: CampRoster = createEmptyCampRoster();
    occupiedCampRoster[3] = preoccupiedCharacter;
    const campStateWithOccupiedSlot = buildFixtureCampState({
      campRoster: occupiedCampRoster,
    });

    const buyResult = buyCharacter(
      campStateWithOccupiedSlot,
      fixtureShopCatalogue,
      "fixture-listing-1",
      3,
      "new-dwarf-1",
    );

    expect(buyResult).toEqual({
      outcome: "rejected",
      rejectionReason: "slotOccupied",
    });
  });

  it("(i) rejects a slot index outside the roster", () => {
    const campStateWithTenGold = buildFixtureCampState();

    const buyResultWithSlotIndexTooHigh = buyCharacter(
      campStateWithTenGold,
      fixtureShopCatalogue,
      "fixture-listing-1",
      7,
      "new-dwarf-1",
    );
    const buyResultWithSlotIndexTooLow = buyCharacter(
      campStateWithTenGold,
      fixtureShopCatalogue,
      "fixture-listing-1",
      -1,
      "new-dwarf-1",
    );

    expect(buyResultWithSlotIndexTooHigh).toEqual({
      outcome: "rejected",
      rejectionReason: "invalidSlot",
    });
    expect(buyResultWithSlotIndexTooLow).toEqual({
      outcome: "rejected",
      rejectionReason: "invalidSlot",
    });
  });

  it("(j) rejects a non-integer slot index", () => {
    const campStateWithTenGold = buildFixtureCampState();

    const buyResult = buyCharacter(
      campStateWithTenGold,
      fixtureShopCatalogue,
      "fixture-listing-1",
      1.5,
      "new-dwarf-1",
    );

    expect(buyResult).toEqual({
      outcome: "rejected",
      rejectionReason: "invalidSlot",
    });
  });

  it("(k) does not mutate the input camp state or the catalogue", () => {
    const campStateWithTenGold = buildFixtureCampState();
    const campStateClone = structuredClone(campStateWithTenGold);
    const shopCatalogueClone = structuredClone(fixtureShopCatalogue);

    buyCharacter(
      campStateWithTenGold,
      fixtureShopCatalogue,
      "fixture-listing-1",
      0,
      "new-dwarf-1",
    );

    expect(campStateWithTenGold).toEqual(campStateClone);
    expect(fixtureShopCatalogue).toEqual(shopCatalogueClone);
  });
});
