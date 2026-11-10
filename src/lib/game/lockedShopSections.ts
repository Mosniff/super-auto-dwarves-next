// These are placeholder sections whose slots are all locked and offer
// nothing. They're display-only constants, not stored in the save, because
// nothing about them changes during a run. When a section gets rules, it
// leaves this list and gets its own module, names and storage, like the
// character section (CharacterShopSlot). The array order is display order.
export const LOCKED_SHOP_SECTION_IDS = ["equipment", "magic", "food"] as const;

export type LockedShopSectionId = (typeof LOCKED_SHOP_SECTION_IDS)[number];

export const LOCKED_SHOP_SECTION_SLOT_COUNTS: Readonly<
  Record<LockedShopSectionId, number>
> = {
  equipment: 4,
  magic: 4,
  food: 2,
};
