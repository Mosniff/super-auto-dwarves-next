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
import type { CreateEnemyEncounter } from "./enemyEncounter";
import { buildPlaceholderEnemyEncounter } from "./dummyEnemyRoster";

export function advanceGame(
  gameState: GameState,
  characterShopRollingSources: CharacterShopRollingSources,
  findAbility: (
    character: Character,
  ) => CharacterAbility | undefined = findCharacterAbilityForCharacter,
  // A fixture convenience default (seed 0); the server always passes its
  // own, with a rolled seed (Phase 13).
  createEnemyEncounter: CreateEnemyEncounter = () =>
    buildPlaceholderEnemyEncounter(0),
): GameState {
  switch (gameState.phase) {
    case "campPhase":
      // The enemy is created once, here, and stored, so every re-resolve
      // of this battle replays it exactly (Phase 13).
      return {
        ...gameState,
        phase: "battlePhase",
        enemyEncounter: createEnemyEncounter(gameState),
      };
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
        // depth goes up with the day on every return to camp (Phase 13)
        depth: gameState.depth + 1,
        gold: CAMP_STARTING_GOLD + campStartGoldGained,
        characterShopSlots: rollCharacterShopSlots(
          countOpenCharacterShopSlots(gameState.characterShopSlots),
          characterShopRollingSources.availableCharacterTemplates,
          characterShopRollingSources.chooseRandomIndex,
        ),
        // the battle is over; its stored enemy goes with it (Phase 13)
        enemyEncounter: null,
      };
    }
    default: {
      const exhaustiveCheck: never = gameState.phase;
      return exhaustiveCheck;
    }
  }
}
