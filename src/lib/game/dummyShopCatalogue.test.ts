import { describe, it, expect } from "vitest";
import { DUMMY_SHOP_CATALOGUE } from "./dummyShopCatalogue";

describe("DUMMY_SHOP_CATALOGUE", () => {
  it("(a) lists three Borin listings", () => {
    expect(
      DUMMY_SHOP_CATALOGUE.map(
        (shopListing) => shopListing.characterTemplate.characterTemplateId,
      ),
    ).toEqual(["borin", "borin", "borin"]);
  });

  it("(b) gives the three listings their fixed ids, in order", () => {
    expect(
      DUMMY_SHOP_CATALOGUE.map((shopListing) => shopListing.shopListingId),
    ).toEqual(["dummy-listing-1", "dummy-listing-2", "dummy-listing-3"]);
  });
});
