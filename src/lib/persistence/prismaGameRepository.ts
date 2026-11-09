import { Prisma } from "@/generated/prisma/client";
import { prismaClient } from "./prismaClient";
import { GameAlreadyExistsError } from "./gameAlreadyExistsError";
import type { GameRepository } from "./gameRepository";

// The real GameRepository, backed by Prisma. Deliberately not unit-tested —
// this is pure Prisma wiring with no logic of its own; first exercised
// end-to-end in Phase 7 (save management).
//
// createGame translates Prisma's unique-constraint violation (P2002, from
// Game.userId's unique constraint) into GameAlreadyExistsError, so code
// above this seam never depends on Prisma's own error types.
export const prismaGameRepository: GameRepository = {
  async loadGameForUser(userId) {
    const gameRow = await prismaClient.game.findUnique({
      where: { userId },
    });

    if (gameRow === null) {
      return null;
    }

    return {
      gameId: gameRow.id,
      // Passed straight through, deliberately NOT cast to CampRoster —
      // casting here would bypass parsePersistedCampRoster entirely.
      // Validation is the handler's job (advanceGameForUser.ts), not this
      // repository's.
      persistedPlayerRoster: gameRow.playerRoster,
      gold: gameRow.gold,
      day: gameRow.day,
      phase: gameRow.phase,
      purchasedShopListingIds: gameRow.purchasedShopListingIds,
      // Passed straight through, deliberately NOT cast to ShopSlots —
      // casting here would bypass parsePersistedShopSlots entirely.
      // Validation is the handler's job, not this repository's.
      persistedShopSlots: gameRow.shopSlots,
      revision: gameRow.revision,
      createdAt: gameRow.createdAt,
    };
  },

  async saveGameState(gameId, nextGameState, expectedRevision) {
    // update requires a unique where and throws when nothing matches, which
    // can't express "only if the revision is still this one" — updateMany
    // lets the revision be part of the condition and reports how many rows
    // it touched, so a lost race (0 rows) is a normal result, not an error.
    const conditionalUpdateResult = await prismaClient.game.updateMany({
      where: { id: gameId, revision: expectedRevision },
      data: {
        // Cast to Prisma's generic JSON input type, since Roster has no
        // index signature. This is the opposite direction of the load-side
        // cast this file avoids: nextGameState.playerRoster already passed
        // through the validated pure pipeline, so this is just telling
        // Prisma how to store it, not bypassing any validation.
        playerRoster: nextGameState.playerRoster as unknown as Prisma.InputJsonValue,
        gold: nextGameState.gold,
        day: nextGameState.day,
        phase: nextGameState.phase,
        purchasedShopListingIds: nextGameState.purchasedShopListingIds,
        // Same cast as playerRoster above: telling Prisma how to store
        // already-validated data, not bypassing validation.
        shopSlots: nextGameState.shopSlots as unknown as Prisma.InputJsonValue,
        revision: { increment: 1 },
      },
    });

    return conditionalUpdateResult.count === 1;
  },

  async createGame(userId, initialGameState) {
    try {
      await prismaClient.game.create({
        data: {
          userId,
          playerRoster:
            initialGameState.playerRoster as unknown as Prisma.InputJsonValue,
          gold: initialGameState.gold,
          day: initialGameState.day,
          phase: initialGameState.phase,
          purchasedShopListingIds: initialGameState.purchasedShopListingIds,
          // Same cast as playerRoster above: telling Prisma how to store
          // already-validated data, not bypassing validation.
          shopSlots:
            initialGameState.shopSlots as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new GameAlreadyExistsError();
      }

      throw error;
    }
  },

  async deleteGameForUser(userId) {
    await prismaClient.game.deleteMany({ where: { userId } });
  },
};
