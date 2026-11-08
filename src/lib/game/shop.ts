import type { CharacterTemplate } from "./characterTemplates";

export const SHOP_CHARACTER_PRICE = 3;

export interface ShopListing {
  shopListingId: string;
  characterTemplate: CharacterTemplate;
}
