export const SHOP_CHARACTER_PRICE = 3;

// The one affordability check (Phase 16), shared by the buy rule
// (notEnoughGold) and the shop's price tags, so a tag can never disagree
// with what the server accepts.
export function canAffordShopCharacter(gold: number): boolean {
  return gold >= SHOP_CHARACTER_PRICE;
}

// Gold gained for selling any character. Flat for now; future effects will
// change it, and this is the one place to edit.
export const CHARACTER_SELL_PRICE = 1;
