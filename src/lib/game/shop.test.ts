import { describe, it, expect } from "vitest";
import { SHOP_CHARACTER_PRICE, canAffordShopCharacter } from "./shop";

// Phase 16: the one affordability check, shared by the buy rule
// (notEnoughGold) and the shop's price tags, so a tag can never disagree
// with what the server accepts.
describe("canAffordShopCharacter", () => {
  it("SP1: affordable at exactly the price and above, not below", () => {
    expect([
      canAffordShopCharacter(SHOP_CHARACTER_PRICE - 1),
      canAffordShopCharacter(SHOP_CHARACTER_PRICE),
      canAffordShopCharacter(SHOP_CHARACTER_PRICE + 1),
      canAffordShopCharacter(0),
    ]).toEqual([false, true, true, false]);
  });
});
