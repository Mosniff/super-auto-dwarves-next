import { createNewGameState } from "@/lib/game/createNewGameState";
import type { ShopRollingSources } from "@/lib/game/shopSlots";
import type { GameRepository } from "./gameRepository";

// Creates a new save from createNewGameState(). The one-save-per-user rule
// is enforced by the database's unique constraint and surfaces here as
// GameAlreadyExistsError via the repository (see gameAlreadyExistsError.ts)
// — this function doesn't catch it; the Server Action above decides how to
// present that error to the player.
export async function createGameForUser(
  userId: string,
  gameRepository: GameRepository,
  shopRollingSources: ShopRollingSources,
): Promise<void> {
  await gameRepository.createGame(userId, createNewGameState(shopRollingSources));
}
