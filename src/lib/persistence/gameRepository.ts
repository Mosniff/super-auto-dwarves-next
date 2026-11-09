import type { GamePhase, GameState } from "@/lib/game/types";

export interface LoadedGameRecord {
  gameId: string;
  // Deliberately unknown — the database cannot promise this column's shape;
  // validating it is the handler's job (see parsePersistedCampRoster.ts).
  persistedPlayerRoster: unknown;
  gold: number;
  day: number;
  phase: GamePhase;
  // Prisma types this string[], but the Postgres column is nullable
  // (Prisma never adds NOT NULL to array columns), so handlers treat null
  // as [].
  purchasedShopListingIds: string[] | null;
  // Deliberately unknown — the database cannot promise this column's shape;
  // validating it is the handler's job (see parsePersistedShopSlots.ts).
  persistedShopSlots: unknown;
  revision: number;
  createdAt: Date;
}

// This interface is the seam that lets advanceGameForUser, createGameForUser
// and loadSavedGameForUser be tested without a database — tests supply a
// fake implementation; prismaGameRepository.ts supplies the real one.
export interface GameRepository {
  loadGameForUser(userId: string): Promise<LoadedGameRecord | null>;
  // Writes only if the stored revision still equals expectedRevision,
  // incrementing it on success; resolves true if saved, false if the game
  // changed since it was loaded (a lost race, not an error). See
  // CLAUDE.md -> "Persistence & save model".
  saveGameState(
    gameId: string,
    nextGameState: GameState,
    expectedRevision: number,
  ): Promise<boolean>;
  // Must reject with GameAlreadyExistsError if the user already has a game.
  createGame(userId: string, initialGameState: GameState): Promise<void>;
  // Deleting when no game exists is a no-op, not an error.
  deleteGameForUser(userId: string): Promise<void>;
}
