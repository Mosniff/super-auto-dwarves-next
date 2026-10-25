import type { GameState } from "@/lib/game/types";
import { parsePersistedRoster } from "./parsePersistedRoster";
import type { GameRepository } from "./gameRepository";

export interface SavedGame {
  gameState: GameState;
  createdAt: Date;
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

  const validatedRoster = parsePersistedRoster(record.persistedPlayerRoster);

  return {
    gameState: {
      playerRoster: validatedRoster,
      gold: record.gold,
      day: record.day,
      phase: record.phase,
    },
    createdAt: record.createdAt,
  };
}
