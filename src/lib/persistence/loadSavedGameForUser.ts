import type { GameState } from "@/lib/game/types";
import { buildGameStateFromLoadedRecord } from "./buildGameStateFromLoadedRecord";
import type { GameRepository } from "./gameRepository";

export interface SavedGame {
  gameState: GameState;
  createdAt: Date;
  // What a later intent (e.g. advanceGameAction) will send back as its
  // expected revision, so the save can be conditional on nothing having
  // changed underneath it since this load.
  revision: number;
}

// This is the single tested place where a stored game is loaded for
// display (the saves page and the play page) — the stored JSON roster is
// never trusted unvalidated.
export async function loadSavedGameForUser(
  userId: string,
  gameRepository: GameRepository,
): Promise<SavedGame | null> {
  const record = await gameRepository.loadGameForUser(userId);

  if (record === null) {
    return null;
  }

  return {
    gameState: buildGameStateFromLoadedRecord(record),
    createdAt: record.createdAt,
    revision: record.revision,
  };
}
