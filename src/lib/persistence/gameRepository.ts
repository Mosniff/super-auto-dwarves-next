import type { GamePhase, GameState } from "@/lib/game/types";

export interface LoadedGameRecord {
  gameId: string;
  // Deliberately unknown — the database cannot promise this column's shape;
  // validating it is the handler's job (see parsePersistedRoster.ts).
  persistedPlayerRoster: unknown;
  gold: number;
  day: number;
  phase: GamePhase;
  createdAt: Date;
}

// This interface is the seam that lets advanceGameForUser, createGameForUser
// and loadSavedGameForUser be tested without a database — tests supply a
// fake implementation; prismaGameRepository.ts supplies the real one.
export interface GameRepository {
  loadGameForUser(userId: string): Promise<LoadedGameRecord | null>;
  saveGameState(gameId: string, nextGameState: GameState): Promise<void>;
  // Must reject with GameAlreadyExistsError if the user already has a game.
  createGame(userId: string, initialGameState: GameState): Promise<void>;
  // Deleting when no game exists is a no-op, not an error.
  deleteGameForUser(userId: string): Promise<void>;
}
