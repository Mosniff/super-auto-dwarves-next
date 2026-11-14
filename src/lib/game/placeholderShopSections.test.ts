import { describe, it, expect } from "vitest";
import {
  PLACEHOLDER_SHOP_SECTION_IDS,
  PLACEHOLDER_SHOP_SECTION_SLOT_COUNTS,
} from "./placeholderShopSections";

describe("placeholderShopSections", () => {
  it("(a) lists the placeholder sections in display order", () => {
    expect(PLACEHOLDER_SHOP_SECTION_IDS).toEqual([
      "equipment",
      "magic",
      "food",
    ]);
  });

  it("(b) gives equipment 4 slots, magic 4 and food 2", () => {
    expect(PLACEHOLDER_SHOP_SECTION_SLOT_COUNTS).toEqual({
      equipment: 4,
      magic: 4,
      food: 2,
    });
  });
});
