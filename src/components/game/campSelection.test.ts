import { describe, it, expect } from "vitest";
import type { OwnedCharacter } from "@/lib/game/ownedCharacter";
import { CAMP_ROSTER_SLOT_COUNT, type CampRoster } from "@/lib/game/campRoster";
import type { CampState } from "@/lib/game/campState";
import type { CharacterTemplate } from "@/lib/game/characterTemplates";
import {
  fixtureCharacterShopTemplateOne,
  fixtureCharacterShopTemplateTwo,
  buildFixtureCharacterShopSlots,
  buildOfferingCharacterShopSlot,
  LOCKED_CHARACTER_SHOP_SLOT,
  SOLD_CHARACTER_SHOP_SLOT,
} from "@/test/characterShopFixtures";
import {
  isBuyTargetSlot,
  isCampClickEffective,
  isCharacterShopSlotSelectable,
  isRepositionTargetSlot,
  isRosterSlotSelectable,
  presentCampTarget,
  resolveCampClick,
  resolveCampDrop,
  type CampSelection,
} from "./campSelection";

function buildFixtureCharacter(id: string, name: string): OwnedCharacter {
  return {
    id,
    name,
    attack: 1,
    hp: 10,
    maxHp: 10,
    characterTemplateId: "fixture-dwarf",
    tier: 1,
    characterClassIds: ["warrior"],
  };
}

const fixtureCharacterTemplates: CharacterTemplate[] = [
  fixtureCharacterShopTemplateOne,
  fixtureCharacterShopTemplateTwo,
];

const fixtureBorin = buildFixtureCharacter("dwarf-1", "Borin");

// characterShopSlots: [offering "fixture-dwarf-one", offering
// "fixture-dwarf-two", SOLD, five LOCKED] — matches
// buildFixtureCharacterShopSlots() exactly.
const baseCampState: CampState = {
  campRoster: [fixtureBorin, null, null, null, null, null, null],
  gold: 10,
  characterShopSlots: buildFixtureCharacterShopSlots(),
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
  characterShopSlots: buildFixtureCharacterShopSlots(),
};

const allSlotIndices = Array.from(
  { length: CAMP_ROSTER_SLOT_COUNT },
  (_, slotIndex) => slotIndex,
);

describe("availability", () => {
  it("(a) a character shop slot is selectable when it can be bought into some roster slot", () => {
    expect(
      isCharacterShopSlotSelectable(baseCampState, fixtureCharacterTemplates, 0),
    ).toBe(true);
  });

  it("(b) a sold slot is not selectable", () => {
    const campStateWithSoldSlot: CampState = {
      ...baseCampState,
      characterShopSlots: [
        SOLD_CHARACTER_SHOP_SLOT,
        buildOfferingCharacterShopSlot("fixture-dwarf-two"),
        SOLD_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
      ],
    };

    expect(
      isCharacterShopSlotSelectable(
        campStateWithSoldSlot,
        fixtureCharacterTemplates,
        0,
      ),
    ).toBe(false);
  });

  it("(c) a character shop slot is not selectable without enough gold", () => {
    const campStateWithTooLittleGold: CampState = {
      ...baseCampState,
      gold: 2,
    };

    expect(
      isCharacterShopSlotSelectable(
        campStateWithTooLittleGold,
        fixtureCharacterTemplates,
        0,
      ),
    ).toBe(false);
  });

  it("(d) a character shop slot is not selectable when every roster slot is occupied", () => {
    expect(
      isCharacterShopSlotSelectable(fullCampState, fixtureCharacterTemplates, 0),
    ).toBe(false);
  });

  it("(e) the buy targets are exactly the empty slots", () => {
    expect(
      allSlotIndices.map((slotIndex) =>
        isBuyTargetSlot(baseCampState, fixtureCharacterTemplates, 0, slotIndex),
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

  it("(ll) a locked slot is not selectable, and with nothing in hand presents as ineligible", () => {
    expect(
      isCharacterShopSlotSelectable(baseCampState, fixtureCharacterTemplates, 3),
    ).toBe(false);

    expect(
      presentCampTarget(
        { selectionKind: "none" },
        { targetKind: "characterShopSlot", shopSlotIndex: 3 },
        baseCampState,
        fixtureCharacterTemplates,
      ),
    ).toBe("ineligible");
  });

  it("(mm) an offering whose template id isn't in characterTemplates is not selectable", () => {
    const campStateWithUnknownTemplateOffering: CampState = {
      ...baseCampState,
      characterShopSlots: [
        buildOfferingCharacterShopSlot("no-such-dwarf"),
        buildOfferingCharacterShopSlot("fixture-dwarf-two"),
        SOLD_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
      ],
    };

    expect(
      isCharacterShopSlotSelectable(
        campStateWithUnknownTemplateOffering,
        fixtureCharacterTemplates,
        0,
      ),
    ).toBe(false);
  });
});

describe("resolveCampClick", () => {
  const noneSelected: CampSelection = { selectionKind: "none" };

  it("(h) selecting a buyable character shop slot", () => {
    const resolution = resolveCampClick(
      noneSelected,
      { targetKind: "characterShopSlot", shopSlotIndex: 0 },
      baseCampState,
      fixtureCharacterTemplates,
    );

    expect(resolution).toEqual({
      nextCampSelection: {
        selectionKind: "characterShopSlot",
        shopSlotIndex: 0,
      },
      campIntentToSubmit: null,
    });
  });

  it("(i) clicking the selected shop slot again clears the selection", () => {
    const shopSlotSelected: CampSelection = {
      selectionKind: "characterShopSlot",
      shopSlotIndex: 0,
    };

    const resolution = resolveCampClick(
      shopSlotSelected,
      { targetKind: "characterShopSlot", shopSlotIndex: 0 },
      baseCampState,
      fixtureCharacterTemplates,
    );

    expect(resolution).toEqual({
      nextCampSelection: noneSelected,
      campIntentToSubmit: null,
    });
  });

  it("(j) clicking an empty slot with a shop slot selected submits a buy and clears the selection", () => {
    const shopSlotSelected: CampSelection = {
      selectionKind: "characterShopSlot",
      shopSlotIndex: 0,
    };

    const resolution = resolveCampClick(
      shopSlotSelected,
      { targetKind: "rosterSlot", slotIndex: 3 },
      baseCampState,
      fixtureCharacterTemplates,
    );

    expect(resolution).toEqual({
      nextCampSelection: noneSelected,
      campIntentToSubmit: {
        intentKind: "buyCharacter",
        shopSlotIndex: 0,
        targetRosterSlotIndex: 3,
      },
    });
  });

  it("(k) clicking an occupied slot with a shop slot selected changes nothing", () => {
    const shopSlotSelected: CampSelection = {
      selectionKind: "characterShopSlot",
      shopSlotIndex: 0,
    };

    const resolution = resolveCampClick(
      shopSlotSelected,
      { targetKind: "rosterSlot", slotIndex: 0 },
      baseCampState,
      fixtureCharacterTemplates,
    );

    expect(resolution).toEqual({
      nextCampSelection: shopSlotSelected,
      campIntentToSubmit: null,
    });
  });

  it("(l) selecting an occupied roster slot", () => {
    const resolution = resolveCampClick(
      noneSelected,
      { targetKind: "rosterSlot", slotIndex: 0 },
      baseCampState,
      fixtureCharacterTemplates,
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
      fixtureCharacterTemplates,
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
      fixtureCharacterTemplates,
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
      fixtureCharacterTemplates,
    );

    expect(resolution).toEqual({
      nextCampSelection: noneSelected,
      campIntentToSubmit: null,
    });
  });

  it("(p) clicking an unselectable shop slot with nothing selected changes nothing", () => {
    const campStateWithSoldSlot: CampState = {
      ...baseCampState,
      characterShopSlots: [
        SOLD_CHARACTER_SHOP_SLOT,
        buildOfferingCharacterShopSlot("fixture-dwarf-two"),
        SOLD_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
      ],
    };

    const resolution = resolveCampClick(
      noneSelected,
      { targetKind: "characterShopSlot", shopSlotIndex: 0 },
      campStateWithSoldSlot,
      fixtureCharacterTemplates,
    );

    expect(resolution).toEqual({
      nextCampSelection: noneSelected,
      campIntentToSubmit: null,
    });
  });

  it("(q) clicking a different selectable shop slot switches the selection", () => {
    const shopSlotZeroSelected: CampSelection = {
      selectionKind: "characterShopSlot",
      shopSlotIndex: 0,
    };

    const resolution = resolveCampClick(
      shopSlotZeroSelected,
      { targetKind: "characterShopSlot", shopSlotIndex: 1 },
      baseCampState,
      fixtureCharacterTemplates,
    );

    expect(resolution).toEqual({
      nextCampSelection: {
        selectionKind: "characterShopSlot",
        shopSlotIndex: 1,
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
        { targetKind: "characterShopSlot", shopSlotIndex: 0 },
        baseCampState,
        fixtureCharacterTemplates,
      ),
    ).toBe(true);
  });

  it("(s) clicking the selected item again is effective, because it cancels", () => {
    const shopSlotZeroSelected: CampSelection = {
      selectionKind: "characterShopSlot",
      shopSlotIndex: 0,
    };

    expect(
      isCampClickEffective(
        shopSlotZeroSelected,
        { targetKind: "characterShopSlot", shopSlotIndex: 0 },
        baseCampState,
        fixtureCharacterTemplates,
      ),
    ).toBe(true);
  });

  it("(t) a click that would change nothing is not effective", () => {
    const shopSlotZeroSelected: CampSelection = {
      selectionKind: "characterShopSlot",
      shopSlotIndex: 0,
    };

    expect(
      isCampClickEffective(
        shopSlotZeroSelected,
        { targetKind: "rosterSlot", slotIndex: 0 },
        baseCampState,
        fixtureCharacterTemplates,
      ),
    ).toBe(false);
  });

  it("(u) a click that submits an intent is effective", () => {
    const shopSlotZeroSelected: CampSelection = {
      selectionKind: "characterShopSlot",
      shopSlotIndex: 0,
    };

    expect(
      isCampClickEffective(
        shopSlotZeroSelected,
        { targetKind: "rosterSlot", slotIndex: 3 },
        baseCampState,
        fixtureCharacterTemplates,
      ),
    ).toBe(true);
  });
});

describe("resolveCampDrop", () => {
  it("(v) dropping a shop slot on an empty slot yields a buy intent", () => {
    const shopSlotZeroSelected: CampSelection = {
      selectionKind: "characterShopSlot",
      shopSlotIndex: 0,
    };

    expect(
      resolveCampDrop(
        shopSlotZeroSelected,
        { targetKind: "rosterSlot", slotIndex: 3 },
        baseCampState,
        fixtureCharacterTemplates,
      ),
    ).toEqual({
      intentKind: "buyCharacter",
      shopSlotIndex: 0,
      targetRosterSlotIndex: 3,
    });
  });

  it("(w) dropping a shop slot on an occupied slot yields nothing", () => {
    const shopSlotZeroSelected: CampSelection = {
      selectionKind: "characterShopSlot",
      shopSlotIndex: 0,
    };

    expect(
      resolveCampDrop(
        shopSlotZeroSelected,
        { targetKind: "rosterSlot", slotIndex: 0 },
        baseCampState,
        fixtureCharacterTemplates,
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
        fixtureCharacterTemplates,
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
        fixtureCharacterTemplates,
      ),
    ).toBeNull();
  });

  it("(z) dropping with a sold slot as the drag source yields nothing", () => {
    const shopSlotZeroSelected: CampSelection = {
      selectionKind: "characterShopSlot",
      shopSlotIndex: 0,
    };
    const campStateWithSoldSlot: CampState = {
      ...baseCampState,
      characterShopSlots: [
        SOLD_CHARACTER_SHOP_SLOT,
        buildOfferingCharacterShopSlot("fixture-dwarf-two"),
        SOLD_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
      ],
    };

    expect(
      resolveCampDrop(
        shopSlotZeroSelected,
        { targetKind: "rosterSlot", slotIndex: 3 },
        campStateWithSoldSlot,
        fixtureCharacterTemplates,
      ),
    ).toBeNull();
  });
});

describe("presentCampTarget", () => {
  const nothingHeld: CampSelection = { selectionKind: "none" };
  const shopSlotZeroHeld: CampSelection = {
    selectionKind: "characterShopSlot",
    shopSlotIndex: 0,
  };
  const slotZeroHeld: CampSelection = {
    selectionKind: "rosterSlot",
    slotIndex: 0,
  };

  it("(aa) with nothing in hand, every target is neutral", () => {
    expect([
      presentCampTarget(
        nothingHeld,
        { targetKind: "rosterSlot", slotIndex: 0 },
        baseCampState,
        fixtureCharacterTemplates,
      ),
      presentCampTarget(
        nothingHeld,
        { targetKind: "rosterSlot", slotIndex: 3 },
        baseCampState,
        fixtureCharacterTemplates,
      ),
      presentCampTarget(
        nothingHeld,
        { targetKind: "characterShopSlot", shopSlotIndex: 0 },
        baseCampState,
        fixtureCharacterTemplates,
      ),
    ]).toEqual(["neutral", "neutral", "neutral"]);
  });

  it("(bb) the held shop slot presents as held", () => {
    expect(
      presentCampTarget(
        shopSlotZeroHeld,
        { targetKind: "characterShopSlot", shopSlotIndex: 0 },
        baseCampState,
        fixtureCharacterTemplates,
      ),
    ).toBe("held");
  });

  it("(cc) with a shop slot in hand, empty slots are eligible", () => {
    expect(
      presentCampTarget(
        shopSlotZeroHeld,
        { targetKind: "rosterSlot", slotIndex: 3 },
        baseCampState,
        fixtureCharacterTemplates,
      ),
    ).toBe("eligible");
  });

  it("(dd) with a shop slot in hand, occupied slots are ineligible", () => {
    expect(
      presentCampTarget(
        shopSlotZeroHeld,
        { targetKind: "rosterSlot", slotIndex: 0 },
        baseCampState,
        fixtureCharacterTemplates,
      ),
    ).toBe("ineligible");
  });

  it("(ee) with a shop slot in hand, another buyable shop slot is neutral because clicking it switches", () => {
    expect(
      presentCampTarget(
        shopSlotZeroHeld,
        { targetKind: "characterShopSlot", shopSlotIndex: 1 },
        baseCampState,
        fixtureCharacterTemplates,
      ),
    ).toBe("neutral");
  });

  it("(ff) the held roster slot presents as held", () => {
    expect(
      presentCampTarget(
        slotZeroHeld,
        { targetKind: "rosterSlot", slotIndex: 0 },
        baseCampState,
        fixtureCharacterTemplates,
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
          fixtureCharacterTemplates,
        ),
      ),
    ).toEqual([
      "eligible",
      "eligible",
      "eligible",
      "eligible",
      "eligible",
      "eligible",
    ]);
  });

  it("(hh) with a dwarf in hand, a shop slot that can't be bought is ineligible", () => {
    const campStateWithSoldSlot: CampState = {
      ...baseCampState,
      characterShopSlots: [
        SOLD_CHARACTER_SHOP_SLOT,
        buildOfferingCharacterShopSlot("fixture-dwarf-two"),
        SOLD_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
      ],
    };

    expect(
      presentCampTarget(
        slotZeroHeld,
        { targetKind: "characterShopSlot", shopSlotIndex: 0 },
        campStateWithSoldSlot,
        fixtureCharacterTemplates,
      ),
    ).toBe("ineligible");
  });

  it("(ii) with nothing in hand, a shop slot the player can't afford is ineligible", () => {
    const campStateWithTooLittleGold: CampState = {
      ...baseCampState,
      gold: 2,
    };

    expect(
      presentCampTarget(
        nothingHeld,
        { targetKind: "characterShopSlot", shopSlotIndex: 0 },
        campStateWithTooLittleGold,
        fixtureCharacterTemplates,
      ),
    ).toBe("ineligible");
  });

  it("(jj) with nothing in hand, shop slots are ineligible when the roster is full", () => {
    expect(
      presentCampTarget(
        nothingHeld,
        { targetKind: "characterShopSlot", shopSlotIndex: 0 },
        fullCampState,
        fixtureCharacterTemplates,
      ),
    ).toBe("ineligible");
  });

  it("(kk) with nothing in hand, an occupied slot is neutral", () => {
    expect(
      presentCampTarget(
        nothingHeld,
        { targetKind: "rosterSlot", slotIndex: 0 },
        baseCampState,
        fixtureCharacterTemplates,
      ),
    ).toBe("neutral");
  });
});
