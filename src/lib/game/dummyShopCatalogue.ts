import type { ShopListing } from "./shop";

// Placeholder shop data — the same fixed listings every visit — until shop
// logic (stock, rerolls, tiers) is specified. Deliberately copied, not
// imported, from dummy-battle.ts, which part two of Phase 8 removes.
export const DUMMY_SHOP_CATALOGUE: ShopListing[] = [
  {
    shopListingId: "dummy-listing-1",
    characterTemplate: { name: "Borin", attack: 4, hp: 7, maxHp: 7 },
  },
  {
    shopListingId: "dummy-listing-2",
    characterTemplate: { name: "Thrudi", attack: 6, hp: 5, maxHp: 5 },
  },
  {
    shopListingId: "dummy-listing-3",
    characterTemplate: { name: "Gimlok", attack: 3, hp: 9, maxHp: 9 },
  },
  {
    shopListingId: "dummy-listing-4",
    characterTemplate: { name: "Fendra", attack: 8, hp: 4, maxHp: 4 },
  },
  {
    shopListingId: "dummy-listing-5",
    characterTemplate: { name: "Old Khaz", attack: 2, hp: 10, maxHp: 10 },
  },
  {
    shopListingId: "dummy-listing-6",
    characterTemplate: { name: "Bryndle", attack: 5, hp: 6, maxHp: 6 },
  },
  {
    shopListingId: "dummy-listing-7",
    characterTemplate: { name: "Wyrnstout", attack: 7, hp: 3, maxHp: 3 },
  },
];
