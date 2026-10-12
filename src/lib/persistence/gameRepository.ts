import type { GamePhase, GameState } from "@/lib/game/types";

export interface LoadedGameRecord {
  gameId: string;
  // Deliberately unknown — the database cannot promise this column's shape;
  // validating it is the handler's job (see parsePersistedRoster.ts).
  persistedPlayerRoster: unknown;
  gold: number;
  day: number;
  phase: GamePhase;
}

// This interface is the seam that lets advanceGameForUser be tested without
// a database — tests supply a fake implementation; prismaGameRepository.ts
// supplies the real one.
export interface GameRepository {
  loadGameForUser(userId: string): Promise<LoadedGameRecord | null>;
  saveGameState(gameId: string, nextGameState: GameState): Promise<void>;
}
