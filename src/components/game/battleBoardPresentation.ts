import type { BattleState } from "@/lib/battle/types";
import type { Character } from "@/lib/game/character";
import type { CampRoster } from "@/lib/game/campRoster";

export interface BattleBoardPresentation {
  playerBenchCharacters: (Character | null)[];
  playerFrontCharacter: Character | undefined;
  enemyBenchCharacters: (Character | null)[];
  enemyFrontCharacter: Character | undefined;
}

// What the battle board shows, before vs. after the first beat. Before the
// battle has started, the player's bench shows the saved camp roster exactly
// as it was in camp (gaps and front dwarf included), the enemy's bench shows
// its whole lineup, and both action-zone fronts are empty. From the first
// beat on, presentation follows the battle state as it always has: each
// bench shows everyone behind the front character, who sits in the action
// zone. This is presentation only — it never changes battle state.
export function presentBattleBoard({
  battleState,
  hasBattleStarted,
  playerCampRoster,
}: {
  battleState: BattleState;
  hasBattleStarted: boolean;
  playerCampRoster: CampRoster;
}): BattleBoardPresentation {
  if (!hasBattleStarted) {
    return {
      playerBenchCharacters: [...playerCampRoster],
      playerFrontCharacter: undefined,
      enemyBenchCharacters: [...battleState.enemy.activeCharacters],
      enemyFrontCharacter: undefined,
    };
  }

  return {
    playerBenchCharacters: battleState.player.activeCharacters.slice(1),
    playerFrontCharacter: battleState.player.activeCharacters[0],
    enemyBenchCharacters: battleState.enemy.activeCharacters.slice(1),
    enemyFrontCharacter: battleState.enemy.activeCharacters[0],
  };
}
