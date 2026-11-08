import { CHARACTER_TEMPLATES } from "./characterTemplates";
import type { ShopListing } from "./shop";

// Placeholder until Phase 9 part 3 replaces it with rolled shop slots.
// Three listings to match the three open camp slots; all Borin because
// Borin is the only template defined so far.
export const DUMMY_SHOP_CATALOGUE: ShopListing[] = [
  {
    shopListingId: "dummy-listing-1",
    characterTemplate: CHARACTER_TEMPLATES.borin,
  },
  {
    shopListingId: "dummy-listing-2",
    characterTemplate: CHARACTER_TEMPLATES.borin,
  },
  {
    shopListingId: "dummy-listing-3",
    characterTemplate: CHARACTER_TEMPLATES.borin,
  },
];
