import type { BattleEvent, BattleState } from "@/lib/battle/types";
import type { Character } from "@/lib/game/character";
import type { CampRoster } from "@/lib/game/campRoster";

export interface BattleBoardPresentation {
  playerBenchCharacters: (Character | null)[];
  playerFrontCharacter: Character | undefined;
  enemyBenchCharacters: (Character | null)[];
  enemyFrontCharacter: Character | undefined;
}

// The board's three stages (Phase 12): the camp roster as saved; preparing
// (gaps closed, everyone still on the bench, so battle-start abilities play
// there); engaged (fronts in the action zone). Presentation only.
export type BattleBoardStage = "beforeBattle" | "preparing" | "engaged";

// A battle with an empty side never engages (step 11a), so it stays
// preparing: there's no one to send forward.
export function battleBoardStage(
  events: readonly BattleEvent[],
  playbackBeat: number,
): BattleBoardStage {
  if (playbackBeat < 0) {
    return "beforeBattle";
  }

  const hasEngaged = events.some(
    (event) => event.type === "FRONTS_ENGAGE" && event.beatIndex <= playbackBeat,
  );

  return hasEngaged ? "engaged" : "preparing";
}

// What the battle board shows, across its three stages. Before the battle
// has started, the player's bench shows the saved camp roster exactly as it
// was in camp (gaps and front dwarf included), the enemy's bench shows its
// whole lineup, and both action-zone fronts are empty. While preparing
// (after the prepare beat but before the engage beat), both benches show
// every active character with the gaps closed, front first, and both
// action-zone fronts are still empty — this is where battle-start abilities
// play. From the engage beat on, each bench shows everyone behind the front
// character, who sits in the action zone; the existing on-deck launch plays
// here, because that's when slot 0's occupant changes. This is presentation
// only — it never changes battle state.
export function presentBattleBoard({
  battleState,
  battleBoardStage,
  playerCampRoster,
}: {
  battleState: BattleState;
  battleBoardStage: BattleBoardStage;
  playerCampRoster: CampRoster;
}): BattleBoardPresentation {
  switch (battleBoardStage) {
    case "beforeBattle":
      return {
        playerBenchCharacters: [...playerCampRoster],
        playerFrontCharacter: undefined,
        enemyBenchCharacters: [...battleState.enemy.activeCharacters],
        enemyFrontCharacter: undefined,
      };
    case "preparing":
      return {
        playerBenchCharacters: [...battleState.player.activeCharacters],
        playerFrontCharacter: undefined,
        enemyBenchCharacters: [...battleState.enemy.activeCharacters],
        enemyFrontCharacter: undefined,
      };
    case "engaged":
      return {
        playerBenchCharacters: battleState.player.activeCharacters.slice(1),
        playerFrontCharacter: battleState.player.activeCharacters[0],
        enemyBenchCharacters: battleState.enemy.activeCharacters.slice(1),
        enemyFrontCharacter: battleState.enemy.activeCharacters[0],
      };
    default: {
      const unreachableBattleBoardStage: never = battleBoardStage;
      return unreachableBattleBoardStage;
    }
  }
}
