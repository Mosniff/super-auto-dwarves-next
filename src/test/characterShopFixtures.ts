import type { CharacterTemplate } from "@/lib/game/characterTemplates";
import type {
  CharacterShopRollingSources,
  CharacterShopSlot,
  CharacterShopSlots,
} from "@/lib/game/characterShopSlots";
import type { ChooseRandomIndex } from "@/lib/game/chooseRandomIndex";

export const fixtureCharacterShopTemplateOne: CharacterTemplate = {
  characterTemplateId: "fixture-dwarf-one",
  name: "Fixture Dwarf One",
  tier: 1,
  characterClassIds: ["warrior"],
  attack: 2,
  maxHp: 5,
};

export const fixtureCharacterShopTemplateTwo: CharacterTemplate = {
  characterTemplateId: "fixture-dwarf-two",
  name: "Fixture Dwarf Two",
  tier: 2,
  characterClassIds: ["smith", "miner"],
  attack: 3,
  maxHp: 8,
};

export function buildOfferingCharacterShopSlot(
  characterTemplateId: string,
): CharacterShopSlot {
  return { slotState: "offering", characterTemplateId };
}

export const LOCKED_CHARACTER_SHOP_SLOT = { slotState: "locked" } as const;
export const SOLD_CHARACTER_SHOP_SLOT = { slotState: "sold" } as const;

export function buildFixtureCharacterShopSlots(): CharacterShopSlots {
  return [
    buildOfferingCharacterShopSlot(
      fixtureCharacterShopTemplateOne.characterTemplateId,
    ),
    buildOfferingCharacterShopSlot(
      fixtureCharacterShopTemplateTwo.characterTemplateId,
    ),
    SOLD_CHARACTER_SHOP_SLOT,
    LOCKED_CHARACTER_SHOP_SLOT,
    LOCKED_CHARACTER_SHOP_SLOT,
    LOCKED_CHARACTER_SHOP_SLOT,
    LOCKED_CHARACTER_SHOP_SLOT,
    LOCKED_CHARACTER_SHOP_SLOT,
  ];
}

export function buildFixtureCharacterShopRollingSources(
  scriptedIndexes: number[] = [],
): {
  characterShopRollingSources: CharacterShopRollingSources;
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

  const characterShopRollingSources: CharacterShopRollingSources = {
    availableCharacterTemplates: [
      fixtureCharacterShopTemplateOne,
      fixtureCharacterShopTemplateTwo,
    ],
    chooseRandomIndex,
  };

  return { characterShopRollingSources, recordedOptionCounts };
}
