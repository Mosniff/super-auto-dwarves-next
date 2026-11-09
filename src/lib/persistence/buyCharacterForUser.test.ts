import { describe, it, expect } from "vitest";
import type { GameState } from "@/lib/game/types";
import type { CampRoster } from "@/lib/game/campRoster";
import type { OwnedCharacter } from "@/lib/game/ownedCharacter";
import type { CharacterTemplate } from "@/lib/game/characterTemplates";
import type { CharacterShopSlots } from "@/lib/game/characterShopSlots";
import type { GameRepository, LoadedGameRecord } from "./gameRepository";
import {
  buyCharacterForUser,
  type BuyCharacterIntent,
} from "./buyCharacterForUser";
import {
  buildFixtureCharacterShopSlots,
  buildOfferingCharacterShopSlot,
  fixtureCharacterShopTemplateOne,
  fixtureCharacterShopTemplateTwo,
  LOCKED_CHARACTER_SHOP_SLOT,
  SOLD_CHARACTER_SHOP_SLOT,
} from "@/test/characterShopFixtures";

const fixtureBorin: OwnedCharacter = {
  id: "dwarf-1",
  name: "Borin",
  attack: 3,
  hp: 5,
  maxHp: 5,
  characterTemplateId: "fixture-dwarf",
  tier: 1,
  characterClassIds: ["warrior"],
};

const fixtureCampRoster: CampRoster = [
  fixtureBorin,
  null,
  null,
  null,
  null,
  null,
  null,
];

const fixtureCharacterTemplates: CharacterTemplate[] = [
  fixtureCharacterShopTemplateOne,
  fixtureCharacterShopTemplateTwo,
];

interface RecordedSaveGameStateCall {
  gameId: string;
  nextGameState: GameState;
  expectedRevision: number;
}

function buildFakeGameRepository(
  initialLoadedGameRecord: LoadedGameRecord | null,
  options?: { saveGameStateResult?: boolean },
) {
  const saveGameStateResult = options?.saveGameStateResult ?? true;
  const recordedSaveGameStateCalls: RecordedSaveGameStateCall[] = [];

  const gameRepository: GameRepository = {
    loadGameForUser: async () => initialLoadedGameRecord,
    saveGameState: async (gameId, nextGameState, expectedRevision) => {
      recordedSaveGameStateCalls.push({
        gameId,
        nextGameState,
        expectedRevision,
      });
      return saveGameStateResult;
    },
    createGame: async () => {},
    deleteGameForUser: async () => {},
  };

  return { gameRepository, recordedSaveGameStateCalls };
}

function buildFixtureLoadedGameRecord(
  overrides: Partial<LoadedGameRecord> = {},
): LoadedGameRecord {
  return {
    gameId: "fixture-game-1",
    persistedPlayerRoster: fixtureCampRoster,
    gold: 10,
    day: 2,
    phase: "campPhase",
    purchasedShopListingIds: [],
    persistedCharacterShopSlots: buildFixtureCharacterShopSlots(),
    revision: 5,
    createdAt: new Date("2026-10-13T00:00:00.000Z"),
    ...overrides,
  };
}

// buildFixtureCharacterShopSlots() offers "fixture-dwarf-one" at slot 0 and
// "fixture-dwarf-two" at slot 1, with slot 2 already sold.
const fixtureBuyIntent: BuyCharacterIntent = {
  shopSlotIndex: 1,
  targetRosterSlotIndex: 3,
  expectedRevision: 5,
};

function buildFixtureDependencies(gameRepository: GameRepository) {
  return {
    gameRepository,
    characterTemplates: fixtureCharacterTemplates,
    generateCharacterId: () => "generated-dwarf-1",
  };
}

describe("buyCharacterForUser", () => {
  it("(a) saves the bought character, spent gold and sold shop slot, and reports accepted", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord());

    const result = await buyCharacterForUser(
      "fixture-user-1",
      fixtureBuyIntent,
      buildFixtureDependencies(gameRepository),
    );

    const expectedCampRoster: CampRoster = [
      fixtureBorin,
      null,
      null,
      {
        id: "generated-dwarf-1",
        ...fixtureCharacterShopTemplateTwo,
        characterClassIds: [
          ...fixtureCharacterShopTemplateTwo.characterClassIds,
        ],
        hp: fixtureCharacterShopTemplateTwo.maxHp,
      },
      null,
      null,
      null,
    ];
    const expectedCharacterShopSlots: CharacterShopSlots = [
      buildOfferingCharacterShopSlot("fixture-dwarf-one"),
      SOLD_CHARACTER_SHOP_SLOT,
      SOLD_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
      LOCKED_CHARACTER_SHOP_SLOT,
    ];
    const expectedGameState: GameState = {
      playerRoster: expectedCampRoster,
      gold: 7,
      day: 2,
      phase: "campPhase",
      purchasedShopListingIds: [],
      characterShopSlots: expectedCharacterShopSlots,
    };

    expect(result).toEqual({ outcome: "accepted" });
    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.nextGameState,
      ),
    ).toEqual([expectedGameState]);
  });

  it("(b) saves conditionally on the loaded revision", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord());

    await buyCharacterForUser(
      "fixture-user-1",
      fixtureBuyIntent,
      buildFixtureDependencies(gameRepository),
    );

    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.expectedRevision,
      ),
    ).toEqual([5]);
  });

  it("(c) returns the rule's rejection and saves nothing", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord());

    const result = await buyCharacterForUser(
      "fixture-user-1",
      { ...fixtureBuyIntent, shopSlotIndex: 2 },
      buildFixtureDependencies(gameRepository),
    );

    expect(result).toEqual({
      outcome: "rejected",
      rejectionReason: "shopSlotSold",
    });
    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.nextGameState,
      ),
    ).toEqual([]);
  });

  it("(d) treats a stale expected revision as stale and saves nothing", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(buildFixtureLoadedGameRecord());

    const result = await buyCharacterForUser(
      "fixture-user-1",
      { ...fixtureBuyIntent, expectedRevision: 4 },
      buildFixtureDependencies(gameRepository),
    );

    expect(result).toEqual({ outcome: "stale" });
    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.nextGameState,
      ),
    ).toEqual([]);
  });

  it("(e) treats an intent outside campPhase as stale and saves nothing", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(
        buildFixtureLoadedGameRecord({ phase: "battlePhase" }),
      );

    const result = await buyCharacterForUser(
      "fixture-user-1",
      fixtureBuyIntent,
      buildFixtureDependencies(gameRepository),
    );

    expect(result).toEqual({ outcome: "stale" });
    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.nextGameState,
      ),
    ).toEqual([]);
  });

  it("(f) reports stale when the conditional save finds the game changed", async () => {
    const { gameRepository } = buildFakeGameRepository(
      buildFixtureLoadedGameRecord(),
      { saveGameStateResult: false },
    );

    const result = await buyCharacterForUser(
      "fixture-user-1",
      fixtureBuyIntent,
      buildFixtureDependencies(gameRepository),
    );

    expect(result).toEqual({ outcome: "stale" });
  });

  it("(g) rejects when the user has no game", async () => {
    const { gameRepository } = buildFakeGameRepository(null);

    await expect(
      buyCharacterForUser(
        "fixture-user-1",
        fixtureBuyIntent,
        buildFixtureDependencies(gameRepository),
      ),
    ).rejects.toThrow();
  });

  it("(h) rejects when the stored roster is malformed, saving nothing", async () => {
    const { gameRepository, recordedSaveGameStateCalls } =
      buildFakeGameRepository(
        buildFixtureLoadedGameRecord({
          persistedPlayerRoster: { activeCharacters: "not-an-array" },
        }),
      );

    await expect(
      buyCharacterForUser(
        "fixture-user-1",
        fixtureBuyIntent,
        buildFixtureDependencies(gameRepository),
      ),
    ).rejects.toThrow();
    expect(
      recordedSaveGameStateCalls.map(
        (recordedCall) => recordedCall.nextGameState,
      ),
    ).toEqual([]);
  });
});
