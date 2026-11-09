import { describe, it, expect } from "vitest";
import { createGameForUser } from "./createGameForUser";
import { createNewGameState } from "@/lib/game/createNewGameState";
import { GameAlreadyExistsError } from "./gameAlreadyExistsError";
import type { GameRepository } from "./gameRepository";
import type { GameState } from "@/lib/game/types";
import {
  buildFixtureShopRollingSources,
  buildOfferingShopSlot,
  LOCKED_SHOP_SLOT,
} from "@/test/shopFixtures";

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
      buildFixtureShopRollingSources().shopRollingSources,
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
      buildFixtureShopRollingSources([0, 0, 0]).shopRollingSources,
    );

    expect(
      recordedCreateGameCalls.map((recordedCall) => recordedCall.initialGameState),
    ).toEqual([
      createNewGameState(buildFixtureShopRollingSources([0, 0, 0]).shopRollingSources),
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
        buildFixtureShopRollingSources().shopRollingSources,
      ),
    ).rejects.toBeInstanceOf(GameAlreadyExistsError);
  });

  it("G1: passes the rolled shop through to the initial game state", async () => {
    const { gameRepository, recordedCreateGameCalls } =
      buildFakeGameRepository();

    await createGameForUser(
      "fixture-user-1",
      gameRepository,
      buildFixtureShopRollingSources([1, 0, 0]).shopRollingSources,
    );

    expect(
      recordedCreateGameCalls.map(
        (recordedCall) => recordedCall.initialGameState.shopSlots,
      ),
    ).toEqual([
      [
        buildOfferingShopSlot("fixture-dwarf-two"),
        buildOfferingShopSlot("fixture-dwarf-one"),
        buildOfferingShopSlot("fixture-dwarf-one"),
        LOCKED_SHOP_SLOT,
        LOCKED_SHOP_SLOT,
        LOCKED_SHOP_SLOT,
        LOCKED_SHOP_SLOT,
        LOCKED_SHOP_SLOT,
      ],
    ]);
  });
});
