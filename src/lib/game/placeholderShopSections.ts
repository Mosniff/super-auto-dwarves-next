// These sections aren't in this version of the game — they're shown as
// "Coming soon". They're display-only constants, not stored in the save,
// because nothing about them changes during a run. When a section gets
// rules, it leaves this list and gets its own module, names and storage,
// like the character section (CharacterShopSlot). The array order is
// display order.
export const PLACEHOLDER_SHOP_SECTION_IDS = [
  "equipment",
  "magic",
  "food",
] as const;

export type PlaceholderShopSectionId =
  (typeof PLACEHOLDER_SHOP_SECTION_IDS)[number];

export const PLACEHOLDER_SHOP_SECTION_SLOT_COUNTS: Readonly<
  Record<PlaceholderShopSectionId, number>
> = {
  equipment: 4,
  magic: 4,
  food: 2,
};
