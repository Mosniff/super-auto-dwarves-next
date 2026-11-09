import { describe, it, expect } from "vitest";
import {
  buildFixtureCharacterShopSlots,
  buildOfferingCharacterShopSlot,
  LOCKED_CHARACTER_SHOP_SLOT,
  SOLD_CHARACTER_SHOP_SLOT,
} from "@/test/characterShopFixtures";
import { parsePersistedCharacterShopSlots } from "./parsePersistedCharacterShopSlots";

function doesParseThrow(persistedValue: unknown): boolean {
  try {
    parsePersistedCharacterShopSlots(persistedValue);
    return false;
  } catch {
    return true;
  }
}

describe("parsePersistedCharacterShopSlots", () => {
  it("P1: parses a valid shop to itself", () => {
    const fixtureCharacterShopSlots = buildFixtureCharacterShopSlots();

    expect(parsePersistedCharacterShopSlots(fixtureCharacterShopSlots)).toEqual(
      fixtureCharacterShopSlots,
    );
  });

  it("P2: parses eight locked slots to themselves", () => {
    const allLockedShopSlots = Array.from(
      { length: 8 },
      () => LOCKED_CHARACTER_SHOP_SLOT,
    );

    expect(parsePersistedCharacterShopSlots(allLockedShopSlots)).toEqual(
      allLockedShopSlots,
    );
  });

  it("P3: throws for a non-array or a wrong-length array", () => {
    const invalidPersistedValues = [
      "shop",
      null,
      Array.from({ length: 7 }, () => LOCKED_CHARACTER_SHOP_SLOT),
      Array.from({ length: 9 }, () => LOCKED_CHARACTER_SHOP_SLOT),
    ];

    expect(invalidPersistedValues.map(doesParseThrow)).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  it("P4: throws for an invalid slot", () => {
    const restOfFixtureCharacterShopSlots = buildFixtureCharacterShopSlots().slice(1);
    const invalidCandidateSlots = [
      5,
      null,
      { slotState: "open" },
      { slotState: "offering" },
      { slotState: "offering", characterTemplateId: "" },
      { slotState: "offering", characterTemplateId: 3 },
    ];

    expect(
      invalidCandidateSlots.map((invalidCandidateSlot) =>
        doesParseThrow([invalidCandidateSlot, ...restOfFixtureCharacterShopSlots]),
      ),
    ).toEqual([true, true, true, true, true, true]);
  });

  it("P5: throws when a non-locked slot comes after a locked slot", () => {
    const shopSlotsWithOfferingAfterLocked = [
      buildOfferingCharacterShopSlot("fixture-dwarf-one"),
      LOCKED_CHARACTER_SHOP_SLOT,
      buildOfferingCharacterShopSlot("fixture-dwarf-two"),
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
    ];
    const shopSlotsWithSoldAfterLocked = [
      LOCKED_CHARACTER_SHOP_SLOT,
      SOLD_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
    ];

    expect(
      [shopSlotsWithOfferingAfterLocked, shopSlotsWithSoldAfterLocked].map(
        doesParseThrow,
      ),
    ).toEqual([true, true]);
  });
});
