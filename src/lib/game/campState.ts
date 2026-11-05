import type { CampRoster } from "./campRoster";

// Gold is set (not added) to this at the start of every camp, including a
// new game's first camp; unspent gold is lost (game rule decided by the
// human, Phase 8).
export const CAMP_STARTING_GOLD = 10;

// The slice of run-state the camp rules (buyCharacter, repositionCharacter)
// operate on.
export interface CampState {
  campRoster: CampRoster;
  gold: number;
  purchasedShopListingIds: string[];
}
