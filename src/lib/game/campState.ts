import type { CampRoster } from "./campRoster";

// The slice of run-state the camp rules (buyCharacter, repositionCharacter)
// operate on.
export interface CampState {
  campRoster: CampRoster;
  gold: number;
  purchasedShopListingIds: string[];
}
