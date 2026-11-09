import type { CharacterTemplate } from "@/lib/game/characterTemplates";
import type {
  ChooseRandomIndex,
  ShopRollingSources,
  ShopSlot,
  ShopSlots,
} from "@/lib/game/shopSlots";

export const fixtureShopTemplateOne: CharacterTemplate = {
  characterTemplateId: "fixture-dwarf-one",
  name: "Fixture Dwarf One",
  tier: 1,
  characterClassIds: ["warrior"],
  attack: 2,
  maxHp: 5,
};

export const fixtureShopTemplateTwo: CharacterTemplate = {
  characterTemplateId: "fixture-dwarf-two",
  name: "Fixture Dwarf Two",
  tier: 2,
  characterClassIds: ["smith", "miner"],
  attack: 3,
  maxHp: 8,
};

export function buildOfferingShopSlot(characterTemplateId: string): ShopSlot {
  return { slotState: "offering", characterTemplateId };
}

export const LOCKED_SHOP_SLOT = { slotState: "locked" } as const;
export const SOLD_SHOP_SLOT = { slotState: "sold" } as const;

export function buildFixtureShopSlots(): ShopSlots {
  return [
    buildOfferingShopSlot(fixtureShopTemplateOne.characterTemplateId),
    buildOfferingShopSlot(fixtureShopTemplateTwo.characterTemplateId),
    SOLD_SHOP_SLOT,
    LOCKED_SHOP_SLOT,
    LOCKED_SHOP_SLOT,
    LOCKED_SHOP_SLOT,
    LOCKED_SHOP_SLOT,
    LOCKED_SHOP_SLOT,
  ];
}

export function buildFixtureShopRollingSources(
  scriptedIndexes: number[] = [],
): {
  shopRollingSources: ShopRollingSources;
  recordedOptionCounts: number[];
} {
  const recordedOptionCounts: number[] = [];
  let nextScriptedIndexPosition = 0;

  const chooseRandomIndex: ChooseRandomIndex = (optionCount: number) => {
    recordedOptionCounts.push(optionCount);
    const scriptedIndex = scriptedIndexes[nextScriptedIndexPosition];
    nextScriptedIndexPosition += 1;
    return scriptedIndex ?? 0;
  };

  const shopRollingSources: ShopRollingSources = {
    availableCharacterTemplates: [fixtureShopTemplateOne, fixtureShopTemplateTwo],
    chooseRandomIndex,
  };

  return { shopRollingSources, recordedOptionCounts };
}
