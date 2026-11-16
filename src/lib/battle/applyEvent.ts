import type { Character } from "@/lib/game/character";
import type { BattleState, BattleEvent } from "./types";

// Shared by DAMAGE and ARMOUR_DAMAGE: both are a pure assignment of a
// resulting value onto whichever side's character matches the target id,
// leaving every other character (on either side) untouched.
function updateActiveCharacterById(
  state: BattleState,
  characterId: string,
  updateCharacter: (character: Character) => Character,
): BattleState {
  return {
    ...state,
    player: {
      ...state.player,
      activeCharacters: state.player.activeCharacters.map((character) =>
        character.id === characterId ? updateCharacter(character) : character,
      ),
    },
    enemy: {
      ...state.enemy,
      activeCharacters: state.enemy.activeCharacters.map((character) =>
        character.id === characterId ? updateCharacter(character) : character,
      ),
    },
  };
}

export function applyEvent(
  state: BattleState,
  event: BattleEvent,
): BattleState {
  switch (event.type) {
    case "DAMAGE":
      return updateActiveCharacterById(state, event.targetId, (character) => ({
        ...character,
        hp: event.resultingHp,
      }));
    case "ARMOUR_DAMAGE":
      return updateActiveCharacterById(state, event.targetId, (character) => ({
        ...character,
        armour: event.resultingArmour,
      }));
    case "DROP": {
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
    case "ATTACK":
    case "BATTLE_START":
    case "TURN_START":
    case "TIMEOUT":
    case "BATTLE_END":
      return state;
    default: {
      const exhaustiveCheck: never = event;
      return exhaustiveCheck;
    }
  }
}
