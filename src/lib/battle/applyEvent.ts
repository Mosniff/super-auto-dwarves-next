import type { BattleState, BattleEvent } from "./types";

export function applyEvent(
  state: BattleState,
  event: BattleEvent,
): BattleState {
  if (event.type === "DAMAGE") {
    return {
      ...state,
      player: state.player.map((character) =>
        character.id === event.targetId
          ? { ...character, hp: event.resultingHp }
          : character,
      ),
      enemy: state.enemy.map((character) =>
        character.id === event.targetId
          ? { ...character, hp: event.resultingHp }
          : character,
      ),
    };
  }
  return state;
}
