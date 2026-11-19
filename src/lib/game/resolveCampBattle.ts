import { resolveBattle } from "@/lib/battle/resolveBattle";
import type { ResolvedBattle } from "@/lib/battle/types";
import { squeezeCampRoster, type CampRoster } from "./campRoster";
import { PLAYER_FACTION_ID } from "./characterFactions";
import type { EnemyEncounter } from "./enemyEncounter";
import { createSeededChooseRandomIndex } from "./seededRandomSource";

// The conversion seam from the saved game to a battle (CLAUDE.md ->
// "Persistence & save model", camp-roster gaps); the camp roster is
// squeezed so battle logic only ever receives a gapless line; the enemy
// comes from the stored encounter, and both sides' factions are always
// passed explicitly (Phase 13). Deterministic, so re-resolving on reload
// replays the identical battle.
export function resolveCampBattle(
  playerCampRoster: CampRoster,
  enemyEncounter: EnemyEncounter,
): ResolvedBattle {
  return resolveBattle(
    squeezeCampRoster(playerCampRoster).activeCharacters,
    enemyEncounter.enemyCharacters,
    undefined,
    undefined,
    {
      playerFactionId: PLAYER_FACTION_ID,
      enemyFactionId: enemyEncounter.enemyFactionId,
    },
    // a fresh source from the stored seed on every resolve (Phase 13)
    createSeededChooseRandomIndex(enemyEncounter.battleSeed),
  );
}
