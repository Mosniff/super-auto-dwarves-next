import type { Character } from "./character";
import type { CharacterFactionId } from "./characterFactions";
import type { GameState } from "./types";

// The enemy for the battle the player is in, generated once on the server
// at camp -> battle and stored on the Game, so every re-resolve (reload,
// advance, end-run) replays the same battle. Null outside battlePhase
// (Phase 13).
export interface EnemyEncounter {
  enemyFactionId: CharacterFactionId;
  // the enemy's gapless fighting line, front first
  enemyCharacters: Character[];
  // seeds the battle's pure random source; an unsigned 32-bit integer
  battleSeed: number;
}

export const MAX_BATTLE_SEED = 0xffffffff;

// Creates the encounter for the battle being entered, given the game state
// as it leaves camp. Injected into advanceGame so the pure logic never
// rolls anything; the server supplies the randomness (Phase 13).
export type CreateEnemyEncounter = (
  enteringGameState: GameState,
) => EnemyEncounter;
