import { describe, it, expect } from "vitest";
import {
  buildFixtureShopSlots,
  buildOfferingShopSlot,
  LOCKED_SHOP_SLOT,
  SOLD_SHOP_SLOT,
} from "@/test/shopFixtures";
import { parsePersistedShopSlots } from "./parsePersistedShopSlots";

function doesParseThrow(persistedValue: unknown): boolean {
  try {
    parsePersistedShopSlots(persistedValue);
    return false;
  } catch {
    return true;
  }
}

describe("parsePersistedShopSlots", () => {
  it("P1: parses a valid shop to itself", () => {
    const fixtureShopSlots = buildFixtureShopSlots();

    expect(parsePersistedShopSlots(fixtureShopSlots)).toEqual(
      fixtureShopSlots,
    );
  });

  it("P2: parses eight locked slots to themselves", () => {
    const allLockedShopSlots = Array.from(
      { length: 8 },
      () => LOCKED_SHOP_SLOT,
    );

    expect(parsePersistedShopSlots(allLockedShopSlots)).toEqual(
      allLockedShopSlots,
    );
  });

  it("P3: throws for a non-array or a wrong-length array", () => {
    const invalidPersistedValues = [
      "shop",
      null,
      Array.from({ length: 7 }, () => LOCKED_SHOP_SLOT),
      Array.from({ length: 9 }, () => LOCKED_SHOP_SLOT),
    ];

    expect(invalidPersistedValues.map(doesParseThrow)).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  it("P4: throws for an invalid slot", () => {
    const restOfFixtureShopSlots = buildFixtureShopSlots().slice(1);
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
        doesParseThrow([invalidCandidateSlot, ...restOfFixtureShopSlots]),
      ),
    ).toEqual([true, true, true, true, true, true]);
  });

  it("P5: throws when a non-locked slot comes after a locked slot", () => {
    const shopSlotsWithOfferingAfterLocked = [
      buildOfferingShopSlot("fixture-dwarf-one"),
      LOCKED_SHOP_SLOT,
      buildOfferingShopSlot("fixture-dwarf-two"),
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
    ];
    const shopSlotsWithSoldAfterLocked = [
      LOCKED_SHOP_SLOT,
      SOLD_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
      LOCKED_SHOP_SLOT,
    ];

    expect(
      [shopSlotsWithOfferingAfterLocked, shopSlotsWithSoldAfterLocked].map(
        doesParseThrow,
      ),
    ).toEqual([true, true]);
  });
});
