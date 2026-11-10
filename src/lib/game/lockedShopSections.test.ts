import { describe, it, expect } from "vitest";
import {
  LOCKED_SHOP_SECTION_IDS,
  LOCKED_SHOP_SECTION_SLOT_COUNTS,
} from "./lockedShopSections";

describe("lockedShopSections", () => {
  it("(a) lists the locked sections in display order", () => {
    expect(LOCKED_SHOP_SECTION_IDS).toEqual(["equipment", "magic", "food"]);
  });

  it("(b) gives equipment 4 slots, magic 4 and food 2", () => {
    expect(LOCKED_SHOP_SECTION_SLOT_COUNTS).toEqual({
      equipment: 4,
      magic: 4,
      food: 2,
    });
  });
});
