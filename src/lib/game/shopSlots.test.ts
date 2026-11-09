import { describe, it, expect } from "vitest";
import type { CharacterTemplate } from "./characterTemplates";
import {
  SHOP_SLOT_COUNT,
  STARTING_OPEN_SHOP_SLOT_COUNT,
  rollShopSlots,
  countOpenShopSlots,
  type ChooseRandomIndex,
  type ShopSlots,
} from "./shopSlots";

const fixtureTemplateOne: CharacterTemplate = {
  characterTemplateId: "fixture-dwarf-one",
  name: "Fixture Dwarf One",
  tier: 1,
  characterClassIds: ["warrior"],
  attack: 2,
  maxHp: 5,
};

const fixtureTemplateTwo: CharacterTemplate = {
  characterTemplateId: "fixture-dwarf-two",
  name: "Fixture Dwarf Two",
  tier: 2,
  characterClassIds: ["smith", "miner"],
  attack: 3,
  maxHp: 8,
};

const LOCKED_SLOT = { slotState: "locked" } as const;

function buildScriptedChooseRandomIndex(scriptedIndexes: number[]): {
  chooseRandomIndex: ChooseRandomIndex;
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

  return { chooseRandomIndex, recordedOptionCounts };
}

function doesThrow(action: () => unknown): boolean {
  try {
    action();
    return false;
  } catch {
    return true;
  }
}

describe("shopSlots", () => {
  it("K1: exposes the slot count and starting open slot count", () => {
    expect([SHOP_SLOT_COUNT, STARTING_OPEN_SHOP_SLOT_COUNT]).toEqual([8, 3]);
  });

  it("R1: rolls open slots in order, then fills the rest with locked slots", () => {
    const { chooseRandomIndex } = buildScriptedChooseRandomIndex([1, 0, 1]);

    const shopSlots = rollShopSlots(
      3,
      [fixtureTemplateOne, fixtureTemplateTwo],
      chooseRandomIndex,
    );

    expect(shopSlots).toEqual([
      { slotState: "offering", characterTemplateId: "fixture-dwarf-two" },
      { slotState: "offering", characterTemplateId: "fixture-dwarf-one" },
      { slotState: "offering", characterTemplateId: "fixture-dwarf-two" },
      LOCKED_SLOT,
      LOCKED_SLOT,
      LOCKED_SLOT,
      LOCKED_SLOT,
      LOCKED_SLOT,
    ]);
  });

  it("R2: calls chooseRandomIndex with the available template count, once per open slot", () => {
    const { chooseRandomIndex, recordedOptionCounts } =
      buildScriptedChooseRandomIndex([1, 0, 1]);

    rollShopSlots(
      3,
      [fixtureTemplateOne, fixtureTemplateTwo],
      chooseRandomIndex,
    );

    expect(recordedOptionCounts).toEqual([2, 2, 2]);
  });

  it("R3: zero open slots rolls nothing and locks every slot", () => {
    const { chooseRandomIndex, recordedOptionCounts } =
      buildScriptedChooseRandomIndex([]);

    const shopSlots = rollShopSlots(0, [fixtureTemplateOne], chooseRandomIndex);

    expect(shopSlots).toEqual(Array.from({ length: 8 }, () => LOCKED_SLOT));
    expect(recordedOptionCounts).toEqual([]);
  });

  it("R4: every slot open rolls eight offerings and locks none", () => {
    const { chooseRandomIndex } = buildScriptedChooseRandomIndex([]);

    const shopSlots = rollShopSlots(8, [fixtureTemplateOne], chooseRandomIndex);

    expect(shopSlots).toEqual(
      Array.from({ length: 8 }, () => ({
        slotState: "offering",
        characterTemplateId: "fixture-dwarf-one",
      })),
    );
  });

  it("R5: throws for an invalid open slot count", () => {
    const invalidOpenCounts = [-1, 9, 1.5];

    expect(
      invalidOpenCounts.map((openCount) =>
        doesThrow(() => {
          const { chooseRandomIndex } = buildScriptedChooseRandomIndex([]);
          return rollShopSlots(
            openCount,
            [fixtureTemplateOne],
            chooseRandomIndex,
          );
        }),
      ),
    ).toEqual([true, true, true]);
  });

  it("R6: throws when there are open slots but no available templates", () => {
    const { chooseRandomIndex } = buildScriptedChooseRandomIndex([]);

    expect(doesThrow(() => rollShopSlots(3, [], chooseRandomIndex))).toBe(
      true,
    );
  });

  it("R7: throws when chooseRandomIndex returns an index outside the template range", () => {
    const invalidIndexes = [2, -1, 0.5];

    expect(
      invalidIndexes.map((invalidIndex) => {
        const { chooseRandomIndex } = buildScriptedChooseRandomIndex([
          invalidIndex,
        ]);
        return doesThrow(() =>
          rollShopSlots(
            1,
            [fixtureTemplateOne, fixtureTemplateTwo],
            chooseRandomIndex,
          ),
        );
      }),
    ).toEqual([true, true, true]);
  });

  it("C1: counts offering and sold slots as open", () => {
    const shopSlots: ShopSlots = [
      { slotState: "offering", characterTemplateId: "fixture-dwarf-one" },
      { slotState: "sold" },
      { slotState: "offering", characterTemplateId: "fixture-dwarf-two" },
      LOCKED_SLOT,
      LOCKED_SLOT,
      LOCKED_SLOT,
      LOCKED_SLOT,
      LOCKED_SLOT,
    ];

    expect(countOpenShopSlots(shopSlots)).toBe(3);
  });

  it("C2: counts zero when every slot is locked", () => {
    const allLockedShopSlots: ShopSlots = Array.from(
      { length: 8 },
      () => LOCKED_SLOT,
    );

    expect(countOpenShopSlots(allLockedShopSlots)).toBe(0);
  });
});
