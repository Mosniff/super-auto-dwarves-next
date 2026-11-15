import { describe, it, expect } from "vitest";
import type { Character } from "@/lib/game/character";
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
  isRosterSlotMatchingHeldItem,
  isRosterSlotSelectable,
  presentCampTarget,
  resolveCampClick,
  resolveCampDrop,
  type CampSelection,
} from "./campSelection";

function buildMergeFixtureCharacter(
  id: string,
  characterTemplateId: string,
  experience: number,
): Character {
  return {
    id,
    name: "Dwarf " + id,
    characterTemplateId,
    tier: 1,
    characterClassIds: ["warrior"],
    attack: 2,
    hp: 5,
    maxHp: 5,
    experience,
  };
}

function buildFixtureCharacter(id: string, name: string): Character {
  return {
    id,
    name,
    attack: 1,
    hp: 10,
    maxHp: 10,
    characterTemplateId: "fixture-dwarf",
    tier: 1,
    characterClassIds: ["warrior"],
    experience: 0,
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

  it("(yy) in reposition mode, a held dwarf presents occupied slots as swap targets and empty slots as eligible", () => {
    const campStateWithTwoDwarves: CampState = {
      ...baseCampState,
      campRoster: [
        fixtureBorin,
        buildFixtureCharacter("dwarf-2", "Thrain"),
        null,
        null,
        null,
        null,
        null,
      ],
    };

    expect(
      [1, 2].map((slotIndex) =>
        presentCampTarget(
          slotZeroHeld,
          { targetKind: "rosterSlot", slotIndex },
          campStateWithTwoDwarves,
          fixtureCharacterTemplates,
          "reposition",
        ),
      ),
    ).toEqual(["swapTarget", "eligible"]);
  });
});

describe("merge targets", () => {
  function buildMatchingCharacter(id: string, experience: number): Character {
    return {
      id,
      name: "Matching Dwarf",
      characterTemplateId: "fixture-dwarf-one",
      tier: 1,
      characterClassIds: ["warrior"],
      attack: 2,
      hp: 5,
      maxHp: 5,
      experience,
    };
  }

  const campStateWithMatches: CampState = {
    campRoster: [
      fixtureBorin,
      buildMatchingCharacter("match-1", 0),
      buildMatchingCharacter("match-max", 15),
      null,
      null,
      null,
      null,
    ],
    gold: 10,
    characterShopSlots: buildFixtureCharacterShopSlots(),
  };

  const shopSlotZeroHeld: CampSelection = {
    selectionKind: "characterShopSlot",
    shopSlotIndex: 0,
  };

  it("(ll) with a shop character in hand, a matching dwarf is a merge target, and a matching level-5 dwarf and non-matching dwarves are ineligible", () => {
    expect(
      [0, 1, 2, 3].map((rosterSlotIndex) =>
        presentCampTarget(
          shopSlotZeroHeld,
          { targetKind: "rosterSlot", slotIndex: rosterSlotIndex },
          campStateWithMatches,
          fixtureCharacterTemplates,
        ),
      ),
    ).toEqual(["ineligible", "mergeTarget", "ineligible", "eligible"]);
  });

  it("(mm) isRosterSlotMatchingHeldItem is true for a merge target and for a matching level-5 dwarf", () => {
    expect(
      [0, 1, 2, 3].map((rosterSlotIndex) =>
        isRosterSlotMatchingHeldItem(
          shopSlotZeroHeld,
          rosterSlotIndex,
          campStateWithMatches,
          fixtureCharacterTemplates,
        ),
      ),
    ).toEqual([false, true, true, false]);
  });

  it("(nn) isRosterSlotMatchingHeldItem is false with nothing in hand or a roster dwarf in hand", () => {
    expect([
      isRosterSlotMatchingHeldItem(
        { selectionKind: "none" },
        1,
        campStateWithMatches,
        fixtureCharacterTemplates,
      ),
      isRosterSlotMatchingHeldItem(
        { selectionKind: "rosterSlot", slotIndex: 0 },
        1,
        campStateWithMatches,
        fixtureCharacterTemplates,
      ),
    ]).toEqual([false, false]);
  });

  it("(oo) with a shop character selected, clicking a matching dwarf submits a buy onto it", () => {
    expect(
      resolveCampClick(
        shopSlotZeroHeld,
        { targetKind: "rosterSlot", slotIndex: 1 },
        campStateWithMatches,
        fixtureCharacterTemplates,
      ),
    ).toEqual({
      nextCampSelection: { selectionKind: "none" },
      campIntentToSubmit: {
        intentKind: "buyCharacter",
        shopSlotIndex: 0,
        targetRosterSlotIndex: 1,
      },
    });
  });

  it("(pp) with nothing in hand, a shop slot stays buyable on a full roster that holds a match", () => {
    const fullCampRosterWithMatch: CampRoster = [
      ...fullCampRoster.slice(0, 6),
      buildMatchingCharacter("match-1", 0),
    ];
    const fullCampStateWithMatch: CampState = {
      campRoster: fullCampRosterWithMatch,
      gold: 10,
      characterShopSlots: buildFixtureCharacterShopSlots(),
    };

    expect(
      presentCampTarget(
        { selectionKind: "none" },
        { targetKind: "characterShopSlot", shopSlotIndex: 0 },
        fullCampStateWithMatch,
        fixtureCharacterTemplates,
      ),
    ).toBe("neutral");
  });
});

describe("merge/sell mode", () => {
  const campStateForMerging: CampState = {
    campRoster: [
      buildMergeFixtureCharacter("a", "fixture-dwarf", 0),
      buildMergeFixtureCharacter("b", "fixture-dwarf", 2),
      buildMergeFixtureCharacter("c", "other-dwarf", 0),
      buildMergeFixtureCharacter("d", "fixture-dwarf", 15),
      null,
      null,
      null,
    ],
    gold: 10,
    characterShopSlots: buildFixtureCharacterShopSlots(),
  };

  const slotZeroHeld: CampSelection = {
    selectionKind: "rosterSlot",
    slotIndex: 0,
  };

  it("(qq) in merge/sell mode, a dwarf is selectable only when it has a merge target", () => {
    expect(
      [0, 1, 2, 3, 4].map((slotIndex) =>
        isRosterSlotSelectable(
          campStateForMerging.campRoster,
          slotIndex,
          "mergeOrSell",
        ),
      ),
    ).toEqual([true, true, false, true, false]);
  });

  it("(rr) in merge/sell mode, clicking a matching dwarf submits a merge", () => {
    expect(
      resolveCampClick(
        slotZeroHeld,
        { targetKind: "rosterSlot", slotIndex: 1 },
        campStateForMerging,
        fixtureCharacterTemplates,
        "mergeOrSell",
      ),
    ).toEqual({
      nextCampSelection: { selectionKind: "none" },
      campIntentToSubmit: {
        intentKind: "mergeCharacters",
        fromSlotIndex: 0,
        intoSlotIndex: 1,
      },
    });
  });

  it("(ss) in merge/sell mode, clicking an empty slot does nothing", () => {
    expect(
      resolveCampClick(
        slotZeroHeld,
        { targetKind: "rosterSlot", slotIndex: 4 },
        campStateForMerging,
        fixtureCharacterTemplates,
        "mergeOrSell",
      ),
    ).toEqual({
      nextCampSelection: slotZeroHeld,
      campIntentToSubmit: null,
    });
  });

  it("(tt) in merge/sell mode, clicking a non-matching dwarf does nothing", () => {
    expect(
      resolveCampClick(
        slotZeroHeld,
        { targetKind: "rosterSlot", slotIndex: 2 },
        campStateForMerging,
        fixtureCharacterTemplates,
        "mergeOrSell",
      ),
    ).toEqual({
      nextCampSelection: slotZeroHeld,
      campIntentToSubmit: null,
    });
  });

  it("(uu) in merge/sell mode, clicking a matching level-5 dwarf does nothing", () => {
    expect(
      resolveCampClick(
        slotZeroHeld,
        { targetKind: "rosterSlot", slotIndex: 3 },
        campStateForMerging,
        fixtureCharacterTemplates,
        "mergeOrSell",
      ),
    ).toEqual({
      nextCampSelection: slotZeroHeld,
      campIntentToSubmit: null,
    });
  });

  it("(vv) in merge/sell mode, a held dwarf presents matches as merge targets and everything else as ineligible", () => {
    expect(
      [1, 2, 3, 4].map((slotIndex) =>
        presentCampTarget(
          slotZeroHeld,
          { targetKind: "rosterSlot", slotIndex },
          campStateForMerging,
          fixtureCharacterTemplates,
          "mergeOrSell",
        ),
      ),
    ).toEqual(["mergeTarget", "ineligible", "ineligible", "ineligible"]);
  });

  it("(ww) a held roster dwarf matches other dwarves only in merge/sell mode", () => {
    expect({
      mergeOrSell: [1, 2, 3].map((slotIndex) =>
        isRosterSlotMatchingHeldItem(
          slotZeroHeld,
          slotIndex,
          campStateForMerging,
          fixtureCharacterTemplates,
          "mergeOrSell",
        ),
      ),
      reposition: [1, 2, 3].map((slotIndex) =>
        isRosterSlotMatchingHeldItem(
          slotZeroHeld,
          slotIndex,
          campStateForMerging,
          fixtureCharacterTemplates,
          "reposition",
        ),
      ),
    }).toEqual({
      mergeOrSell: [true, false, true],
      reposition: [false, false, false],
    });
  });

  it("(xx) in reposition mode, clicking a matching dwarf still swaps", () => {
    expect(
      resolveCampClick(
        slotZeroHeld,
        { targetKind: "rosterSlot", slotIndex: 1 },
        campStateForMerging,
        fixtureCharacterTemplates,
        "reposition",
      ),
    ).toEqual({
      nextCampSelection: { selectionKind: "none" },
      campIntentToSubmit: {
        intentKind: "reposition",
        fromSlotIndex: 0,
        toSlotIndex: 1,
      },
    });
  });
});
