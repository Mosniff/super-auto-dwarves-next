import type { BattleState, BattleEvent } from "./types";

export function applyEvent(
  state: BattleState,
  event: BattleEvent,
): BattleState {
  if (event.type === "DAMAGE") {
    return {
      ...state,
      player: {
        ...state.player,
        activeCharacters: state.player.activeCharacters.map((character) =>
          character.id === event.targetId
            ? { ...character, hp: event.resultingHp }
            : character,
        ),
      },
      enemy: {
        ...state.enemy,
        activeCharacters: state.enemy.activeCharacters.map((character) =>
          character.id === event.targetId
            ? { ...character, hp: event.resultingHp }
            : character,
        ),
      },
    };
  }
  if (event.type === "DROP") {
    const droppedFromPlayer = state.player.activeCharacters.find(
      (character) => character.id === event.characterId,
    );
    if (droppedFromPlayer) {
      return {
        ...state,
        player: {
          activeCharacters: state.player.activeCharacters.filter(
            (character) => character.id !== event.characterId,
          ),
          downedCharacters: [
            ...state.player.downedCharacters,
            droppedFromPlayer,
          ],
        },
      };
    }

    const droppedFromEnemy = state.enemy.activeCharacters.find(
      (character) => character.id === event.characterId,
    );
    if (droppedFromEnemy) {
      return {
        ...state,
        enemy: {
          activeCharacters: state.enemy.activeCharacters.filter(
            (character) => character.id !== event.characterId,
          ),
          downedCharacters: [
            ...state.enemy.downedCharacters,
            droppedFromEnemy,
          ],
        },
      };
    }

    return state;
  }
  return state;
}
