import type { CharacterTemplate } from "./characterTemplates";
import type { ChooseRandomIndex } from "./chooseRandomIndex";

export const CHARACTER_SHOP_SLOT_COUNT = 8;
export const STARTING_OPEN_CHARACTER_SHOP_SLOT_COUNT = 3;

export type CharacterShopSlot =
  | { slotState: "locked" }
  | { slotState: "offering"; characterTemplateId: string }
  | { slotState: "sold" };

export type CharacterShopSlots = CharacterShopSlot[];

export interface CharacterShopRollingSources {
  availableCharacterTemplates: readonly CharacterTemplate[];
  chooseRandomIndex: ChooseRandomIndex;
}

export function rollCharacterShopSlots(
  openShopSlotCount: number,
  availableCharacterTemplates: readonly CharacterTemplate[],
  chooseRandomIndex: ChooseRandomIndex,
): CharacterShopSlots {
  // These throws are programmer errors (bad wiring), not rule rejections.
  if (
    !Number.isInteger(openShopSlotCount) ||
    openShopSlotCount < 0 ||
    openShopSlotCount > CHARACTER_SHOP_SLOT_COUNT
  ) {
    throw new Error(`invalid open shop slot count: ${openShopSlotCount}`);
  }

  if (openShopSlotCount > 0 && availableCharacterTemplates.length === 0) {
    throw new Error("cannot roll an open shop slot with no available character templates");
  }

  const characterShopSlots: CharacterShopSlots = [];

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
    characterShopSlots.push({
      slotState: "offering",
      characterTemplateId: chosenCharacterTemplate.characterTemplateId,
    });
  }

  for (
    let slotIndex = openShopSlotCount;
    slotIndex < CHARACTER_SHOP_SLOT_COUNT;
    slotIndex += 1
  ) {
    characterShopSlots.push({ slotState: "locked" });
  }

  return characterShopSlots;
}

// The open-slot count is derived from the slots, never stored separately;
// sold slots are still open.
export function countOpenCharacterShopSlots(
  characterShopSlots: CharacterShopSlots,
): number {
  return characterShopSlots.filter(
    (characterShopSlot) =>
      characterShopSlot.slotState === "offering" ||
      characterShopSlot.slotState === "sold",
  ).length;
}
