import { createEmptyCampRoster } from "./campRoster";
import { CAMP_STARTING_GOLD } from "./campState";
import {
  rollShopSlots,
  STARTING_OPEN_SHOP_SLOT_COUNT,
  type ShopRollingSources,
} from "./shopSlots";
import type { GameState } from "./types";

// The starting state for a new game: seven empty camp slots, no purchased
// listings, 10 gold, day 1, campPhase — decided 13 October 2026. This is
// deliberately a named function rather than inline literals, because it's
// the seam that will later grow into richer start-of-game logic. Each
// later camp's gold reset lives in advanceGame.ts's battlePhase ->
// campPhase transition. A new game's first camp rolls the shop, same as
// every later camp.
export function createNewGameState(
  shopRollingSources: ShopRollingSources,
): GameState {
  return {
    playerRoster: createEmptyCampRoster(),
    gold: CAMP_STARTING_GOLD,
    day: 1,
    phase: "campPhase",
    purchasedShopListingIds: [],
    shopSlots: rollShopSlots(
      STARTING_OPEN_SHOP_SLOT_COUNT,
      shopRollingSources.availableCharacterTemplates,
      shopRollingSources.chooseRandomIndex,
    ),
  };
}
