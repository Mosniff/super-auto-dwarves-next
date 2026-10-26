import type { Character } from "@/lib/battle/types";

export const SHOP_CHARACTER_PRICE = 3;

export type CharacterTemplate = Omit<Character, "id">;

export interface ShopListing {
  shopListingId: string;
  characterTemplate: CharacterTemplate;
}
