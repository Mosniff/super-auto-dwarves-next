import type { BattleSideFactionIds } from "./resolveBattle";
import type { ResolvedBattle } from "./types";

// Both sides' factions, read from the battle's opening event (Phase 15),
// for the slabs' faction labels.
export function resolvedBattleFactionIds(
  resolvedBattle: ResolvedBattle,
): BattleSideFactionIds | undefined {
  for (const event of resolvedBattle.events) {
    if (event.type === "BATTLE_START") {
      return {
        playerFactionId: event.playerFactionId,
        enemyFactionId: event.enemyFactionId,
      };
    }
  }
  return undefined;
}
