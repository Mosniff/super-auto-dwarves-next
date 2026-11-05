import { describe, it, expect } from "vitest";
import type { CharacterTemplate } from "./shop";
import { DUMMY_SHOP_CATALOGUE } from "./dummyShopCatalogue";

const expectedCharacterTemplates: CharacterTemplate[] = [
  { name: "Borin", attack: 4, hp: 7, maxHp: 7 },
  { name: "Thrudi", attack: 6, hp: 5, maxHp: 5 },
  { name: "Gimlok", attack: 3, hp: 9, maxHp: 9 },
  { name: "Fendra", attack: 8, hp: 4, maxHp: 4 },
  { name: "Old Khaz", attack: 2, hp: 10, maxHp: 10 },
  { name: "Bryndle", attack: 5, hp: 6, maxHp: 6 },
  { name: "Wyrnstout", attack: 7, hp: 3, maxHp: 3 },
];

describe("DUMMY_SHOP_CATALOGUE", () => {
  it("(a) lists the seven placeholder dwarves with their stats, in order", () => {
    expect(
      DUMMY_SHOP_CATALOGUE.map((shopListing) => shopListing.characterTemplate),
    ).toEqual(expectedCharacterTemplates);
  });

  it("(b) gives the seven listings seven distinct ids", () => {
    expect(
      new Set(DUMMY_SHOP_CATALOGUE.map((shopListing) => shopListing.shopListingId))
        .size,
    ).toBe(7);
  });
});
