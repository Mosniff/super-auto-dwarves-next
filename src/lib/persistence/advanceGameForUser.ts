import { advanceGame } from "@/lib/game/advanceGame";
import type { GamePhase, GameState } from "@/lib/game/types";
import { parsePersistedRoster } from "./parsePersistedRoster";
import type { GameRepository } from "./gameRepository";

// Server-authority seam (CLAUDE.md -> "Security / anti-cheat model"): the
// caller supplies only a user id and an intent ("advance"), never state or
// an outcome. The authoritative game is loaded here, its stored roster is
// validated, the pure advanceGame computes the next state, and the result
// is persisted — the only place this intent's effects become real. The
// intent now includes the phase being left, so a stale or repeated intent
// can be recognised and ignored.
export async function advanceGameForUser(
  userId: string,
  expectedCurrentPhase: GamePhase,
  gameRepository: GameRepository,
): Promise<void> {
  const loadedGameRecord = await gameRepository.loadGameForUser(userId);

  if (loadedGameRecord === null) {
    // Deliberately no user id in this message — it is identifying data and
    // this message may reach logs.
    throw new Error("No game found for this user.");
  }

  if (loadedGameRecord.phase !== expectedCurrentPhase) {
    // A stale or repeated advance intent (a double-click or a second tab) is
    // ignored rather than advancing again. This resolves without error, so
    // the caller's redirect simply shows the player the current state.
    return;
  }

  const validatedPlayerRoster = parsePersistedRoster(
    loadedGameRecord.persistedPlayerRoster,
  );

  const currentGameState: GameState = {
    playerRoster: validatedPlayerRoster,
    gold: loadedGameRecord.gold,
    day: loadedGameRecord.day,
    phase: loadedGameRecord.phase,
  };

  const nextGameState = advanceGame(currentGameState);

  await gameRepository.saveGameState(loadedGameRecord.gameId, nextGameState);
}
