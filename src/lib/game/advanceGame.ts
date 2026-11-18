import { CAMP_STARTING_GOLD } from "./campState";
import {
  countOpenCharacterShopSlots,
  rollCharacterShopSlots,
  type CharacterShopRollingSources,
} from "./characterShopSlots";
import { campStartActivations } from "./campStartAbilities";
import { findCharacterAbilityForCharacter } from "./characterAbilityLookup";
import type { Character } from "./character";
import type { CharacterAbility } from "./characterAbilities";
import type { GameState } from "./types";

export function advanceGame(
  gameState: GameState,
  characterShopRollingSources: CharacterShopRollingSources,
  findAbility: (
    character: Character,
  ) => CharacterAbility | undefined = findCharacterAbilityForCharacter,
): GameState {
  switch (gameState.phase) {
    case "campPhase":
      return { ...gameState, phase: "battlePhase" };
    case "battlePhase": {
      // A future battle outcome will become an input to this transition
      // (CLAUDE.md → "Persistence & save model"). Every return to camp
      // resets gold to CAMP_STARTING_GOLD, fires every onCampStart
      // ability front to back (Penny Pincher and friends), and re-rolls
      // every open slot (sold or still offering), keeping the open-slot
      // count.
      const campStartGoldGained = campStartActivations(
        gameState.playerRoster,
        findAbility,
      ).reduce((total, activation) => total + activation.goldGained, 0);

      return {
        ...gameState,
        phase: "campPhase",
        day: gameState.day + 1,
        gold: CAMP_STARTING_GOLD + campStartGoldGained,
        characterShopSlots: rollCharacterShopSlots(
          countOpenCharacterShopSlots(gameState.characterShopSlots),
          characterShopRollingSources.availableCharacterTemplates,
          characterShopRollingSources.chooseRandomIndex,
        ),
      };
    }
    default: {
      const exhaustiveCheck: never = gameState.phase;
      return exhaustiveCheck;
    }
  }
}
