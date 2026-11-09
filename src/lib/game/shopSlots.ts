import type { CharacterTemplate } from "./characterTemplates";

export const SHOP_SLOT_COUNT = 8;
export const STARTING_OPEN_SHOP_SLOT_COUNT = 3;

export type ShopSlot =
  | { slotState: "locked" }
  | { slotState: "offering"; characterTemplateId: string }
  | { slotState: "sold" };

export type ShopSlots = ShopSlot[];

// Returns an integer from 0 to optionCount - 1; injected so pure code never
// calls a random source.
export type ChooseRandomIndex = (optionCount: number) => number;

export function rollShopSlots(
  openShopSlotCount: number,
  availableCharacterTemplates: readonly CharacterTemplate[],
  chooseRandomIndex: ChooseRandomIndex,
): ShopSlots {
  // These throws are programmer errors (bad wiring), not rule rejections.
  if (
    !Number.isInteger(openShopSlotCount) ||
    openShopSlotCount < 0 ||
    openShopSlotCount > SHOP_SLOT_COUNT
  ) {
    throw new Error(`invalid open shop slot count: ${openShopSlotCount}`);
  }

  if (openShopSlotCount > 0 && availableCharacterTemplates.length === 0) {
    throw new Error("cannot roll an open shop slot with no available character templates");
  }

  const shopSlots: ShopSlots = [];

  for (let slotIndex = 0; slotIndex < openShopSlotCount; slotIndex += 1) {
    const templateCount = availableCharacterTemplates.length;
    const chosenIndex = chooseRandomIndex(templateCount);

    if (
      !Number.isInteger(chosenIndex) ||
      chosenIndex < 0 ||
      chosenIndex >= templateCount
    ) {
      throw new Error(`chooseRandomIndex returned an out-of-range index: ${chosenIndex}`);
    }

    const chosenCharacterTemplate = availableCharacterTemplates[chosenIndex];
    shopSlots.push({
      slotState: "offering",
      characterTemplateId: chosenCharacterTemplate.characterTemplateId,
    });
  }

  for (let slotIndex = openShopSlotCount; slotIndex < SHOP_SLOT_COUNT; slotIndex += 1) {
    shopSlots.push({ slotState: "locked" });
  }

  return shopSlots;
}

// The open-slot count is derived from the slots, never stored separately;
// sold slots are still open.
export function countOpenShopSlots(shopSlots: ShopSlots): number {
  return shopSlots.filter(
    (shopSlot) => shopSlot.slotState === "offering" || shopSlot.slotState === "sold",
  ).length;
}
