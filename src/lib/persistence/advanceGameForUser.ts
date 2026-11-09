import { advanceGame } from "@/lib/game/advanceGame";
import type { GamePhase } from "@/lib/game/types";
import type { ShopRollingSources } from "@/lib/game/shopSlots";
import { buildGameStateFromLoadedRecord } from "./buildGameStateFromLoadedRecord";
import type { GameRepository } from "./gameRepository";

// Server-authority seam (CLAUDE.md -> "Security / anti-cheat model"): the
// caller supplies only a user id and an intent ("advance"), never state or
// an outcome. The authoritative game is loaded here, its stored roster is
// validated, the pure advanceGame computes the next state, and the result
// is persisted — the only place this intent's effects become real. The
// intent now includes the phase being left, so a stale or repeated intent
// can be recognised and ignored. The save is also conditional on the
// revision that was loaded, guarding against a concurrent request that
// advanced the game in between (see saveGameState's contract).
export async function advanceGameForUser(
  userId: string,
  expectedCurrentPhase: GamePhase,
  gameRepository: GameRepository,
  shopRollingSources: ShopRollingSources,
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

  const currentGameState = buildGameStateFromLoadedRecord(loadedGameRecord);

  const nextGameState = advanceGame(currentGameState, shopRollingSources);

  const saved = await gameRepository.saveGameState(
    loadedGameRecord.gameId,
    nextGameState,
    loadedGameRecord.revision,
  );

  if (!saved) {
    // The game changed between load and save (a concurrent request won),
    // so this intent is ignored, like the phase-mismatch guard above.
    return;
  }
}
