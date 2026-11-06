import { describe, it, expect } from "vitest";
import type { Character } from "@/lib/battle/types";
import { CAMP_ROSTER_SLOT_COUNT, type CampRoster } from "@/lib/game/campRoster";
import type { CampState } from "@/lib/game/campState";
import type { CharacterTemplate, ShopListing } from "@/lib/game/shop";
import {
  isBuyTargetSlot,
  isCampClickEffective,
  isRepositionTargetSlot,
  isRosterSlotSelectable,
  isShopListingSelectable,
  presentCampTarget,
  resolveCampClick,
  resolveCampDrop,
  type CampSelection,
} from "./campSelection";

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

const fixtureShopCatalogue: ShopListing[] = [
  {
    shopListingId: "fixture-listing-1",
    characterTemplate: fixtureCharacterTemplateOne,
  },
  {
    shopListingId: "fixture-listing-2",
    characterTemplate: fixtureCharacterTemplateTwo,
  },
];

const fixtureBorin = buildFixtureCharacter("dwarf-1", "Borin");

const baseCampState: CampState = {
  campRoster: [fixtureBorin, null, null, null, null, null, null],
  gold: 10,
  purchasedShopListingIds: [],
};

const fullCampRoster: CampRoster = [
  buildFixtureCharacter("character-1", "Dwarf One"),
  buildFixtureCharacter("character-2", "Dwarf Two"),
  buildFixtureCharacter("character-3", "Dwarf Three"),
  buildFixtureCharacter("character-4", "Dwarf Four"),
  buildFixtureCharacter("character-5", "Dwarf Five"),
  buildFixtureCharacter("character-6", "Dwarf Six"),
  buildFixtureCharacter("character-7", "Dwarf Seven"),
];

const fullCampState: CampState = {
  campRoster: fullCampRoster,
  gold: 10,
  purchasedShopListingIds: [],
};

const allSlotIndices = Array.from(
  { length: CAMP_ROSTER_SLOT_COUNT },
  (_, slotIndex) => slotIndex,
);

describe("availability", () => {
  it("(a) a listing is selectable when it can be bought into some slot", () => {
    expect(
      isShopListingSelectable(
        baseCampState,
        fixtureShopCatalogue,
        "fixture-listing-1",
      ),
    ).toBe(true);
  });

  it("(b) a listing is not selectable once bought this visit", () => {
    const campStateWithListingAlreadyPurchased: CampState = {
      ...baseCampState,
      purchasedShopListingIds: ["fixture-listing-1"],
    };

    expect(
      isShopListingSelectable(
        campStateWithListingAlreadyPurchased,
        fixtureShopCatalogue,
        "fixture-listing-1",
      ),
    ).toBe(false);
  });

  it("(c) a listing is not selectable without enough gold", () => {
    const campStateWithTooLittleGold: CampState = {
      ...baseCampState,
      gold: 2,
    };

    expect(
      isShopListingSelectable(
        campStateWithTooLittleGold,
        fixtureShopCatalogue,
        "fixture-listing-1",
      ),
    ).toBe(false);
  });

  it("(d) a listing is not selectable when every slot is occupied", () => {
    expect(
      isShopListingSelectable(
        fullCampState,
        fixtureShopCatalogue,
        "fixture-listing-1",
      ),
    ).toBe(false);
  });

  it("(e) the buy targets are exactly the empty slots", () => {
    expect(
      allSlotIndices.map((slotIndex) =>
        isBuyTargetSlot(
          baseCampState,
          fixtureShopCatalogue,
          "fixture-listing-1",
          slotIndex,
        ),
      ),
    ).toEqual([false, true, true, true, true, true, true]);
  });

  it("(f) only occupied roster slots are selectable", () => {
    expect(
      allSlotIndices.map((slotIndex) =>
        isRosterSlotSelectable(baseCampState.campRoster, slotIndex),
      ),
    ).toEqual([true, false, false, false, false, false, false]);
  });

  it("(g) every other slot is a reposition target for an occupied slot", () => {
    expect(
      allSlotIndices.map((slotIndex) =>
        isRepositionTargetSlot(baseCampState.campRoster, 0, slotIndex),
      ),
    ).toEqual([false, true, true, true, true, true, true]);
  });
});

describe("resolveCampClick", () => {
  const noneSelected: CampSelection = { selectionKind: "none" };

  it("(h) selecting a buyable listing", () => {
    const resolution = resolveCampClick(
      noneSelected,
      { targetKind: "shopListing", shopListingId: "fixture-listing-1" },
      baseCampState,
      fixtureShopCatalogue,
    );

    expect(resolution).toEqual({
      nextCampSelection: {
        selectionKind: "shopListing",
        shopListingId: "fixture-listing-1",
      },
      campIntentToSubmit: null,
    });
  });

  it("(i) clicking the selected listing again clears the selection", () => {
    const listingSelected: CampSelection = {
      selectionKind: "shopListing",
      shopListingId: "fixture-listing-1",
    };

    const resolution = resolveCampClick(
      listingSelected,
      { targetKind: "shopListing", shopListingId: "fixture-listing-1" },
      baseCampState,
      fixtureShopCatalogue,
    );

    expect(resolution).toEqual({
      nextCampSelection: noneSelected,
      campIntentToSubmit: null,
    });
  });

  it("(j) clicking an empty slot with a listing selected submits a buy and clears the selection", () => {
    const listingSelected: CampSelection = {
      selectionKind: "shopListing",
      shopListingId: "fixture-listing-1",
    };

    const resolution = resolveCampClick(
      listingSelected,
      { targetKind: "rosterSlot", slotIndex: 3 },
      baseCampState,
      fixtureShopCatalogue,
    );

    expect(resolution).toEqual({
      nextCampSelection: noneSelected,
      campIntentToSubmit: {
        intentKind: "buy",
        shopListingId: "fixture-listing-1",
        targetSlotIndex: 3,
      },
    });
  });

  it("(k) clicking an occupied slot with a listing selected changes nothing", () => {
    const listingSelected: CampSelection = {
      selectionKind: "shopListing",
      shopListingId: "fixture-listing-1",
    };

    const resolution = resolveCampClick(
      listingSelected,
      { targetKind: "rosterSlot", slotIndex: 0 },
      baseCampState,
      fixtureShopCatalogue,
    );

    expect(resolution).toEqual({
      nextCampSelection: listingSelected,
      campIntentToSubmit: null,
    });
  });

  it("(l) selecting an occupied roster slot", () => {
    const resolution = resolveCampClick(
      noneSelected,
      { targetKind: "rosterSlot", slotIndex: 0 },
      baseCampState,
      fixtureShopCatalogue,
    );

    expect(resolution).toEqual({
      nextCampSelection: { selectionKind: "rosterSlot", slotIndex: 0 },
      campIntentToSubmit: null,
    });
  });

  it("(m) clicking an empty slot with nothing selected changes nothing", () => {
    const resolution = resolveCampClick(
      noneSelected,
      { targetKind: "rosterSlot", slotIndex: 4 },
      baseCampState,
      fixtureShopCatalogue,
    );

    expect(resolution).toEqual({
      nextCampSelection: noneSelected,
      campIntentToSubmit: null,
    });
  });

  it("(n) clicking another slot with a roster slot selected submits a reposition and clears the selection", () => {
    const slotZeroSelected: CampSelection = {
      selectionKind: "rosterSlot",
      slotIndex: 0,
    };

    const resolution = resolveCampClick(
      slotZeroSelected,
      { targetKind: "rosterSlot", slotIndex: 5 },
      baseCampState,
      fixtureShopCatalogue,
    );

    expect(resolution).toEqual({
      nextCampSelection: noneSelected,
      campIntentToSubmit: {
        intentKind: "reposition",
        fromSlotIndex: 0,
        toSlotIndex: 5,
      },
    });
  });

  it("(o) clicking the selected roster slot again clears the selection", () => {
    const slotZeroSelected: CampSelection = {
      selectionKind: "rosterSlot",
      slotIndex: 0,
    };

    const resolution = resolveCampClick(
      slotZeroSelected,
      { targetKind: "rosterSlot", slotIndex: 0 },
      baseCampState,
      fixtureShopCatalogue,
    );

    expect(resolution).toEqual({
      nextCampSelection: noneSelected,
      campIntentToSubmit: null,
    });
  });

  it("(p) clicking an unselectable listing with nothing selected changes nothing", () => {
    const campStateWithListingAlreadyPurchased: CampState = {
      ...baseCampState,
      purchasedShopListingIds: ["fixture-listing-1"],
    };

    const resolution = resolveCampClick(
      noneSelected,
      { targetKind: "shopListing", shopListingId: "fixture-listing-1" },
      campStateWithListingAlreadyPurchased,
      fixtureShopCatalogue,
    );

    expect(resolution).toEqual({
      nextCampSelection: noneSelected,
      campIntentToSubmit: null,
    });
  });

  it("(q) clicking a different selectable listing switches the selection", () => {
    const listingOneSelected: CampSelection = {
      selectionKind: "shopListing",
      shopListingId: "fixture-listing-1",
    };

    const resolution = resolveCampClick(
      listingOneSelected,
      { targetKind: "shopListing", shopListingId: "fixture-listing-2" },
      baseCampState,
      fixtureShopCatalogue,
    );

    expect(resolution).toEqual({
      nextCampSelection: {
        selectionKind: "shopListing",
        shopListingId: "fixture-listing-2",
      },
      campIntentToSubmit: null,
    });
  });
});

describe("isCampClickEffective", () => {
  const noneSelected: CampSelection = { selectionKind: "none" };

  it("(r) a click that selects something is effective", () => {
    expect(
      isCampClickEffective(
        noneSelected,
        { targetKind: "shopListing", shopListingId: "fixture-listing-1" },
        baseCampState,
        fixtureShopCatalogue,
      ),
    ).toBe(true);
  });

  it("(s) clicking the selected item again is effective, because it cancels", () => {
    const listingOneSelected: CampSelection = {
      selectionKind: "shopListing",
      shopListingId: "fixture-listing-1",
    };

    expect(
      isCampClickEffective(
        listingOneSelected,
        { targetKind: "shopListing", shopListingId: "fixture-listing-1" },
        baseCampState,
        fixtureShopCatalogue,
      ),
    ).toBe(true);
  });

  it("(t) a click that would change nothing is not effective", () => {
    const listingOneSelected: CampSelection = {
      selectionKind: "shopListing",
      shopListingId: "fixture-listing-1",
    };

    expect(
      isCampClickEffective(
        listingOneSelected,
        { targetKind: "rosterSlot", slotIndex: 0 },
        baseCampState,
        fixtureShopCatalogue,
      ),
    ).toBe(false);
  });

  it("(u) a click that submits an intent is effective", () => {
    const listingOneSelected: CampSelection = {
      selectionKind: "shopListing",
      shopListingId: "fixture-listing-1",
    };

    expect(
      isCampClickEffective(
        listingOneSelected,
        { targetKind: "rosterSlot", slotIndex: 3 },
        baseCampState,
        fixtureShopCatalogue,
      ),
    ).toBe(true);
  });
});

describe("resolveCampDrop", () => {
  it("(v) dropping a listing on an empty slot yields a buy intent", () => {
    const listingOneSelected: CampSelection = {
      selectionKind: "shopListing",
      shopListingId: "fixture-listing-1",
    };

    expect(
      resolveCampDrop(
        listingOneSelected,
        { targetKind: "rosterSlot", slotIndex: 3 },
        baseCampState,
        fixtureShopCatalogue,
      ),
    ).toEqual({
      intentKind: "buy",
      shopListingId: "fixture-listing-1",
      targetSlotIndex: 3,
    });
  });

  it("(w) dropping a listing on an occupied slot yields nothing", () => {
    const listingOneSelected: CampSelection = {
      selectionKind: "shopListing",
      shopListingId: "fixture-listing-1",
    };

    expect(
      resolveCampDrop(
        listingOneSelected,
        { targetKind: "rosterSlot", slotIndex: 0 },
        baseCampState,
        fixtureShopCatalogue,
      ),
    ).toBeNull();
  });

  it("(x) dropping a dwarf on another slot yields a reposition intent", () => {
    const slotZeroSelected: CampSelection = {
      selectionKind: "rosterSlot",
      slotIndex: 0,
    };

    expect(
      resolveCampDrop(
        slotZeroSelected,
        { targetKind: "rosterSlot", slotIndex: 5 },
        baseCampState,
        fixtureShopCatalogue,
      ),
    ).toEqual({
      intentKind: "reposition",
      fromSlotIndex: 0,
      toSlotIndex: 5,
    });
  });

  it("(y) dropping a dwarf on its own slot yields nothing", () => {
    const slotZeroSelected: CampSelection = {
      selectionKind: "rosterSlot",
      slotIndex: 0,
    };

    expect(
      resolveCampDrop(
        slotZeroSelected,
        { targetKind: "rosterSlot", slotIndex: 0 },
        baseCampState,
        fixtureShopCatalogue,
      ),
    ).toBeNull();
  });

  it("(z) dropping a listing already bought this visit yields nothing", () => {
    const listingOneSelected: CampSelection = {
      selectionKind: "shopListing",
      shopListingId: "fixture-listing-1",
    };
    const campStateWithListingAlreadyPurchased: CampState = {
      ...baseCampState,
      purchasedShopListingIds: ["fixture-listing-1"],
    };

    expect(
      resolveCampDrop(
        listingOneSelected,
        { targetKind: "rosterSlot", slotIndex: 3 },
        campStateWithListingAlreadyPurchased,
        fixtureShopCatalogue,
      ),
    ).toBeNull();
  });
});

describe("presentCampTarget", () => {
  const nothingHeld: CampSelection = { selectionKind: "none" };
  const listingOneHeld: CampSelection = {
    selectionKind: "shopListing",
    shopListingId: "fixture-listing-1",
  };
  const slotZeroHeld: CampSelection = {
    selectionKind: "rosterSlot",
    slotIndex: 0,
  };

  it("(aa) with nothing in hand, every target is neutral", () => {
    expect(
      [
        presentCampTarget(
          nothingHeld,
          { targetKind: "rosterSlot", slotIndex: 0 },
          baseCampState,
          fixtureShopCatalogue,
        ),
        presentCampTarget(
          nothingHeld,
          { targetKind: "rosterSlot", slotIndex: 3 },
          baseCampState,
          fixtureShopCatalogue,
        ),
        presentCampTarget(
          nothingHeld,
          { targetKind: "shopListing", shopListingId: "fixture-listing-1" },
          baseCampState,
          fixtureShopCatalogue,
        ),
      ],
    ).toEqual(["neutral", "neutral", "neutral"]);
  });

  it("(bb) the held listing presents as held", () => {
    expect(
      presentCampTarget(
        listingOneHeld,
        { targetKind: "shopListing", shopListingId: "fixture-listing-1" },
        baseCampState,
        fixtureShopCatalogue,
      ),
    ).toBe("held");
  });

  it("(cc) with a listing in hand, empty slots are eligible", () => {
    expect(
      presentCampTarget(
        listingOneHeld,
        { targetKind: "rosterSlot", slotIndex: 3 },
        baseCampState,
        fixtureShopCatalogue,
      ),
    ).toBe("eligible");
  });

  it("(dd) with a listing in hand, occupied slots are ineligible", () => {
    expect(
      presentCampTarget(
        listingOneHeld,
        { targetKind: "rosterSlot", slotIndex: 0 },
        baseCampState,
        fixtureShopCatalogue,
      ),
    ).toBe("ineligible");
  });

  it("(ee) with a listing in hand, another buyable listing is neutral because clicking it switches", () => {
    expect(
      presentCampTarget(
        listingOneHeld,
        { targetKind: "shopListing", shopListingId: "fixture-listing-2" },
        baseCampState,
        fixtureShopCatalogue,
      ),
    ).toBe("neutral");
  });

  it("(ff) the held roster slot presents as held", () => {
    expect(
      presentCampTarget(
        slotZeroHeld,
        { targetKind: "rosterSlot", slotIndex: 0 },
        baseCampState,
        fixtureShopCatalogue,
      ),
    ).toBe("held");
  });

  it("(gg) with a dwarf in hand, every other slot is eligible", () => {
    const otherSlotIndices = [1, 2, 3, 4, 5, 6];

    expect(
      otherSlotIndices.map((slotIndex) =>
        presentCampTarget(
          slotZeroHeld,
          { targetKind: "rosterSlot", slotIndex },
          baseCampState,
          fixtureShopCatalogue,
        ),
      ),
    ).toEqual(["eligible", "eligible", "eligible", "eligible", "eligible", "eligible"]);
  });

  it("(hh) with a dwarf in hand, a listing that can't be bought is ineligible", () => {
    const campStateWithListingAlreadyPurchased: CampState = {
      ...baseCampState,
      purchasedShopListingIds: ["fixture-listing-1"],
    };

    expect(
      presentCampTarget(
        slotZeroHeld,
        { targetKind: "shopListing", shopListingId: "fixture-listing-1" },
        campStateWithListingAlreadyPurchased,
        fixtureShopCatalogue,
      ),
    ).toBe("ineligible");
  });

  it("(ii) with nothing in hand, a listing the player can't afford is ineligible", () => {
    const campStateWithTooLittleGold: CampState = {
      ...baseCampState,
      gold: 2,
    };

    expect(
      presentCampTarget(
        nothingHeld,
        { targetKind: "shopListing", shopListingId: "fixture-listing-1" },
        campStateWithTooLittleGold,
        fixtureShopCatalogue,
      ),
    ).toBe("ineligible");
  });

  it("(jj) with nothing in hand, listings are ineligible when the roster is full", () => {
    expect(
      presentCampTarget(
        nothingHeld,
        { targetKind: "shopListing", shopListingId: "fixture-listing-1" },
        fullCampState,
        fixtureShopCatalogue,
      ),
    ).toBe("ineligible");
  });

  it("(kk) with nothing in hand, an occupied slot is neutral", () => {
    expect(
      presentCampTarget(
        nothingHeld,
        { targetKind: "rosterSlot", slotIndex: 0 },
        baseCampState,
        fixtureShopCatalogue,
      ),
    ).toBe("neutral");
  });
});
