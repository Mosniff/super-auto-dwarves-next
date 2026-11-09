import { describe, it, expect } from "vitest";
import { createGameForUser } from "./createGameForUser";
import { createNewGameState } from "@/lib/game/createNewGameState";
import { GameAlreadyExistsError } from "./gameAlreadyExistsError";
import type { GameRepository } from "./gameRepository";
import type { GameState } from "@/lib/game/types";
import {
  buildFixtureCharacterShopRollingSources,
  buildOfferingCharacterShopSlot,
  LOCKED_CHARACTER_SHOP_SLOT,
} from "@/test/characterShopFixtures";

interface RecordedCreateGameCall {
  userId: string;
  initialGameState: GameState;
}

function buildFakeGameRepository(options?: { createGameError?: Error }) {
  const recordedCreateGameCalls: RecordedCreateGameCall[] = [];

  const gameRepository: GameRepository = {
    loadGameForUser: async () => null,
    saveGameState: async () => true,
    createGame: async (userId, initialGameState) => {
      recordedCreateGameCalls.push({ userId, initialGameState });
      if (options?.createGameError) {
        throw options.createGameError;
      }
    },
    deleteGameForUser: async () => {},
  };

  return { gameRepository, recordedCreateGameCalls };
}

describe("createGameForUser", () => {
  it("(a) calls createGame exactly once, with the given user id", async () => {
    const { gameRepository, recordedCreateGameCalls } =
      buildFakeGameRepository();

    await createGameForUser(
      "fixture-user-1",
      gameRepository,
      buildFixtureCharacterShopRollingSources().characterShopRollingSources,
    );

    expect(recordedCreateGameCalls).toHaveLength(1);
    expect(recordedCreateGameCalls[0].userId).toBe("fixture-user-1");
  });

  it("(b) passes an initialGameState equal to createNewGameState()", async () => {
    const { gameRepository, recordedCreateGameCalls } =
      buildFakeGameRepository();

    await createGameForUser(
      "fixture-user-1",
      gameRepository,
      buildFixtureCharacterShopRollingSources([0, 0, 0]).characterShopRollingSources,
    );

    expect(
      recordedCreateGameCalls.map((recordedCall) => recordedCall.initialGameState),
    ).toEqual([
      createNewGameState(buildFixtureCharacterShopRollingSources([0, 0, 0]).characterShopRollingSources),
    ]);
  });

  it("(c) rejects with the GameAlreadyExistsError thrown by createGame", async () => {
    const { gameRepository } = buildFakeGameRepository({
      createGameError: new GameAlreadyExistsError(),
    });

    await expect(
      createGameForUser(
        "fixture-user-1",
        gameRepository,
        buildFixtureCharacterShopRollingSources().characterShopRollingSources,
      ),
    ).rejects.toBeInstanceOf(GameAlreadyExistsError);
  });

  it("G1: passes the rolled shop through to the initial game state", async () => {
    const { gameRepository, recordedCreateGameCalls } =
      buildFakeGameRepository();

    await createGameForUser(
      "fixture-user-1",
      gameRepository,
      buildFixtureCharacterShopRollingSources([1, 0, 0]).characterShopRollingSources,
    );

    expect(
      recordedCreateGameCalls.map(
        (recordedCall) => recordedCall.initialGameState.characterShopSlots,
      ),
    ).toEqual([
      [
        buildOfferingCharacterShopSlot("fixture-dwarf-two"),
        buildOfferingCharacterShopSlot("fixture-dwarf-one"),
        buildOfferingCharacterShopSlot("fixture-dwarf-one"),
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
        LOCKED_CHARACTER_SHOP_SLOT,
      ],
    ]);
  });
});
