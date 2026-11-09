import { describe, it, expect } from "vitest";
import {
  buyCharacterFromShopSlot,
  type BuyCharacterFromShopSlotResult,
} from "./buyCharacterFromShopSlot";
import { CAMP_ROSTER_SLOT_COUNT } from "./campRoster";
import type { CampState } from "./campState";
import type { Character } from "@/lib/battle/types";
import type { CharacterTemplate } from "./characterTemplates";
import {
  fixtureCharacterShopTemplateOne,
  fixtureCharacterShopTemplateTwo,
  buildFixtureCharacterShopSlots,
  buildOfferingCharacterShopSlot,
  LOCKED_CHARACTER_SHOP_SLOT,
  SOLD_CHARACTER_SHOP_SLOT,
} from "@/test/characterShopFixtures";

const fixtureCharacterTemplates: CharacterTemplate[] = [
  fixtureCharacterShopTemplateOne,
  fixtureCharacterShopTemplateTwo,
];

const occupiedFixtureCharacter: Character = {
  id: "existing-dwarf",
  name: "Existing Dwarf",
  attack: 2,
  hp: 4,
  maxHp: 4,
  characterTemplateId: "fixture-dwarf-one",
  tier: 1,
  characterClassIds: ["warrior"],
};

function buildFixtureShopCampState(
  overrides: Partial<CampState> = {},
): CampState {
  return {
    campRoster: Array.from({ length: CAMP_ROSTER_SLOT_COUNT }, () => null),
    gold: 10,
    characterShopSlots: buildFixtureCharacterShopSlots(),
    ...overrides,
  };
}

function expectedSpawnedCharacter(
  characterTemplate: CharacterTemplate,
  id: string,
): Character {
  return {
    id,
    ...characterTemplate,
    characterClassIds: [...characterTemplate.characterClassIds],
    hp: characterTemplate.maxHp,
  };
}

function rejectionReasonOf(result: BuyCharacterFromShopSlotResult) {
  if (result.outcome !== "rejected") {
    throw new Error("Expected a rejected result.");
  }
  return result.rejectionReason;
}

describe("buyCharacterFromShopSlot", () => {
  it("B1: buys an offering shop slot into an empty roster slot", () => {
    const fixtureShopCampState = buildFixtureShopCampState();

    const result = buyCharacterFromShopSlot(
      fixtureShopCampState,
      fixtureCharacterTemplates,
      1,
      3,
      "new-dwarf-1",
    );

    expect(result).toEqual({
      outcome: "accepted",
      nextCampState: {
        campRoster: [
          null,
          null,
          null,
          expectedSpawnedCharacter(
            fixtureCharacterShopTemplateTwo,
            "new-dwarf-1",
          ),
          null,
          null,
          null,
        ],
        gold: 7,
        characterShopSlots: [
          buildOfferingCharacterShopSlot("fixture-dwarf-one"),
          SOLD_CHARACTER_SHOP_SLOT,
          SOLD_CHARACTER_SHOP_SLOT,
          LOCKED_CHARACTER_SHOP_SLOT,
          LOCKED_CHARACTER_SHOP_SLOT,
          LOCKED_CHARACTER_SHOP_SLOT,
          LOCKED_CHARACTER_SHOP_SLOT,
          LOCKED_CHARACTER_SHOP_SLOT,
        ],
      },
    });
  });

  it("B2: accepts down to exactly zero gold", () => {
    const fixtureShopCampState = buildFixtureShopCampState({ gold: 3 });

    const result = buyCharacterFromShopSlot(
      fixtureShopCampState,
      fixtureCharacterTemplates,
      0,
      0,
      "new-dwarf-1",
    );

    expect(result).toEqual({
      outcome: "accepted",
      nextCampState: {
        campRoster: [
          expectedSpawnedCharacter(
            fixtureCharacterShopTemplateOne,
            "new-dwarf-1",
          ),
          null,
          null,
          null,
          null,
          null,
          null,
        ],
        gold: 0,
        characterShopSlots: [
          SOLD_CHARACTER_SHOP_SLOT,
          buildOfferingCharacterShopSlot("fixture-dwarf-two"),
          SOLD_CHARACTER_SHOP_SLOT,
          LOCKED_CHARACTER_SHOP_SLOT,
          LOCKED_CHARACTER_SHOP_SLOT,
          LOCKED_CHARACTER_SHOP_SLOT,
          LOCKED_CHARACTER_SHOP_SLOT,
          LOCKED_CHARACTER_SHOP_SLOT,
        ],
      },
    });
  });

  it("B3: buying twice in sequence spawns two characters and sells two slots", () => {
    const fixtureShopCampState = buildFixtureShopCampState();

    const firstResult = buyCharacterFromShopSlot(
      fixtureShopCampState,
      fixtureCharacterTemplates,
      0,
      0,
      "new-dwarf-1",
    );
    if (firstResult.outcome !== "accepted") {
      throw new Error("Expected the first buy to be accepted.");
    }

    const secondResult = buyCharacterFromShopSlot(
      firstResult.nextCampState,
      fixtureCharacterTemplates,
      1,
      1,
      "new-dwarf-2",
    );

    expect(secondResult).toEqual({
      outcome: "accepted",
      nextCampState: {
        campRoster: [
          expectedSpawnedCharacter(
            fixtureCharacterShopTemplateOne,
            "new-dwarf-1",
          ),
          expectedSpawnedCharacter(
            fixtureCharacterShopTemplateTwo,
            "new-dwarf-2",
          ),
          null,
          null,
          null,
          null,
          null,
        ],
        gold: 4,
        characterShopSlots: [
          SOLD_CHARACTER_SHOP_SLOT,
          SOLD_CHARACTER_SHOP_SLOT,
          SOLD_CHARACTER_SHOP_SLOT,
          LOCKED_CHARACTER_SHOP_SLOT,
          LOCKED_CHARACTER_SHOP_SLOT,
          LOCKED_CHARACTER_SHOP_SLOT,
          LOCKED_CHARACTER_SHOP_SLOT,
          LOCKED_CHARACTER_SHOP_SLOT,
        ],
      },
    });
  });

  it("B4: buying the same template from two different slots spawns distinct characters", () => {
    const fixtureShopCampState = buildFixtureShopCampState({
      characterShopSlots: [
        buildOfferingCharacterShopSlot("fixture-dwarf-one"),
        buildOfferingCharacterShopSlot("fixture-dwarf-one"),
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
      ],
    });

    const firstResult = buyCharacterFromShopSlot(
      fixtureShopCampState,
      fixtureCharacterTemplates,
      0,
      0,
      "new-dwarf-1",
    );
    if (firstResult.outcome !== "accepted") {
      throw new Error("Expected the first buy to be accepted.");
    }

    const secondResult = buyCharacterFromShopSlot(
      firstResult.nextCampState,
      fixtureCharacterTemplates,
      1,
      1,
      "new-dwarf-2",
    );
    if (secondResult.outcome !== "accepted") {
      throw new Error("Expected the second buy to be accepted.");
    }

    const [firstBoughtCharacter, secondBoughtCharacter] =
      secondResult.nextCampState.campRoster;

    expect(firstBoughtCharacter).toEqual(
      expectedSpawnedCharacter(fixtureCharacterShopTemplateOne, "new-dwarf-1"),
    );
    expect(secondBoughtCharacter).toEqual(
      expectedSpawnedCharacter(fixtureCharacterShopTemplateOne, "new-dwarf-2"),
    );
    expect(firstBoughtCharacter?.id).not.toBe(secondBoughtCharacter?.id);
    expect(
      secondResult.nextCampState.characterShopSlots.slice(0, 2),
    ).toEqual([SOLD_CHARACTER_SHOP_SLOT, SOLD_CHARACTER_SHOP_SLOT]);
  });

  it("R1: rejects an invalid target roster slot", () => {
    const fixtureShopCampState = buildFixtureShopCampState();
    const invalidTargetRosterSlotIndexes = [-1, 7, 1.5];

    expect(
      invalidTargetRosterSlotIndexes.map((invalidTargetRosterSlotIndex) =>
        rejectionReasonOf(
          buyCharacterFromShopSlot(
            fixtureShopCampState,
            fixtureCharacterTemplates,
            0,
            invalidTargetRosterSlotIndex,
            "new-dwarf-1",
          ),
        ),
      ),
    ).toEqual(["invalidRosterSlot", "invalidRosterSlot", "invalidRosterSlot"]);
  });

  it("R2: rejects an invalid shop slot index", () => {
    const fixtureShopCampState = buildFixtureShopCampState();
    const invalidShopSlotIndexes = [-1, 8, 0.5];

    expect(
      invalidShopSlotIndexes.map((invalidShopSlotIndex) =>
        rejectionReasonOf(
          buyCharacterFromShopSlot(
            fixtureShopCampState,
            fixtureCharacterTemplates,
            invalidShopSlotIndex,
            0,
            "new-dwarf-1",
          ),
        ),
      ),
    ).toEqual(["invalidShopSlot", "invalidShopSlot", "invalidShopSlot"]);
  });

  it("R3: rejects a locked shop slot", () => {
    const fixtureShopCampState = buildFixtureShopCampState();

    const result = buyCharacterFromShopSlot(
      fixtureShopCampState,
      fixtureCharacterTemplates,
      3,
      0,
      "new-dwarf-1",
    );

    expect(result).toEqual({
      outcome: "rejected",
      rejectionReason: "shopSlotLocked",
    });
  });

  it("R4: rejects an already-sold shop slot", () => {
    const fixtureShopCampState = buildFixtureShopCampState();

    const result = buyCharacterFromShopSlot(
      fixtureShopCampState,
      fixtureCharacterTemplates,
      2,
      0,
      "new-dwarf-1",
    );

    expect(result).toEqual({
      outcome: "rejected",
      rejectionReason: "shopSlotSold",
    });
  });

  it("R5: rejects an offering whose template id matches nothing", () => {
    const fixtureShopCampState = buildFixtureShopCampState({
      characterShopSlots: [
        buildOfferingCharacterShopSlot("no-such-dwarf"),
        buildOfferingCharacterShopSlot("fixture-dwarf-two"),
        SOLD_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
      ],
    });

    const result = buyCharacterFromShopSlot(
      fixtureShopCampState,
      fixtureCharacterTemplates,
      0,
      0,
      "new-dwarf-1",
    );

    expect(result).toEqual({
      outcome: "rejected",
      rejectionReason: "unknownCharacterTemplate",
    });
  });

  it("R6: rejects an occupied target roster slot", () => {
    const fixtureShopCampState = buildFixtureShopCampState({
      campRoster: [
        occupiedFixtureCharacter,
        null,
        null,
        null,
        null,
        null,
        null,
      ],
    });

    const result = buyCharacterFromShopSlot(
      fixtureShopCampState,
      fixtureCharacterTemplates,
      0,
      0,
      "new-dwarf-1",
    );

    expect(result).toEqual({
      outcome: "rejected",
      rejectionReason: "rosterSlotOccupied",
    });
  });

  it("R7: rejects when gold is below the flat price", () => {
    const fixtureShopCampState = buildFixtureShopCampState({ gold: 2 });

    const result = buyCharacterFromShopSlot(
      fixtureShopCampState,
      fixtureCharacterTemplates,
      0,
      0,
      "new-dwarf-1",
    );

    expect(result).toEqual({
      outcome: "rejected",
      rejectionReason: "notEnoughGold",
    });
  });

  it("O1: checks in order — invalid roster slot, then shop-level state, then roster occupancy", () => {
    const invalidRosterSlotCase = buyCharacterFromShopSlot(
      buildFixtureShopCampState(),
      fixtureCharacterTemplates,
      3,
      9,
      "new-dwarf-1",
    );

    const soldSlotCase = buyCharacterFromShopSlot(
      buildFixtureShopCampState({
        campRoster: [
          occupiedFixtureCharacter,
          null,
          null,
          null,
          null,
          null,
          null,
        ],
        gold: 0,
      }),
      fixtureCharacterTemplates,
      2,
      0,
      "new-dwarf-1",
    );

    const occupiedSlotCase = buyCharacterFromShopSlot(
      buildFixtureShopCampState({
        campRoster: [
          occupiedFixtureCharacter,
          null,
          null,
          null,
          null,
          null,
          null,
        ],
        gold: 0,
      }),
      fixtureCharacterTemplates,
      0,
      0,
      "new-dwarf-1",
    );

    expect(
      [invalidRosterSlotCase, soldSlotCase, occupiedSlotCase].map(
        rejectionReasonOf,
      ),
    ).toEqual(["invalidRosterSlot", "shopSlotSold", "rosterSlotOccupied"]);
  });

  it("M1: does not mutate the input state or template list on an accepted buy", () => {
    const fixtureShopCampState = buildFixtureShopCampState();
    const shopCampStateClone = structuredClone(fixtureShopCampState);
    const characterTemplatesClone = structuredClone(fixtureCharacterTemplates);

    buyCharacterFromShopSlot(
      fixtureShopCampState,
      fixtureCharacterTemplates,
      0,
      0,
      "new-dwarf-1",
    );

    expect(fixtureShopCampState).toEqual(shopCampStateClone);
    expect(fixtureCharacterTemplates).toEqual(characterTemplatesClone);
  });
});
