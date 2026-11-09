import { CAMP_STARTING_GOLD } from "./campState";
import {
  countOpenShopSlots,
  rollShopSlots,
  type ShopRollingSources,
} from "./shopSlots";
import type { GameState } from "./types";

export function advanceGame(
  gameState: GameState,
  shopRollingSources: ShopRollingSources,
): GameState {
  switch (gameState.phase) {
    case "campPhase":
      return { ...gameState, phase: "battlePhase" };
    case "battlePhase":
      // A future battle outcome will become an input to this transition
      // (CLAUDE.md → "Persistence & save model"). Every return to camp
      // resets gold to CAMP_STARTING_GOLD, clears purchased listings, and
      // re-rolls every open slot (sold or still offering), keeping the
      // open-slot count.
      return {
        ...gameState,
        phase: "campPhase",
        day: gameState.day + 1,
        gold: CAMP_STARTING_GOLD,
        purchasedShopListingIds: [],
        shopSlots: rollShopSlots(
          countOpenShopSlots(gameState.shopSlots),
          shopRollingSources.availableCharacterTemplates,
          shopRollingSources.chooseRandomIndex,
        ),
      };
    default: {
      const exhaustiveCheck: never = gameState.phase;
      return exhaustiveCheck;
    }
  }
}
