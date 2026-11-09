import type { Character } from "./character";
import { resolveBattle } from "@/lib/battle/resolveBattle";
import type { ResolvedBattle } from "@/lib/battle/types";
import { squeezeCampRoster, type CampRoster } from "./campRoster";

// The conversion seam from the saved camp roster to a battle (CLAUDE.md ->
// "Persistence & save model", camp-roster gaps); the camp roster is
// squeezed so battle logic only ever receives a gapless line;
// deterministic, so re-resolving on reload replays the identical battle.
export function resolveCampBattle(
  playerCampRoster: CampRoster,
  enemyCharacters: Character[],
): ResolvedBattle {
  return resolveBattle(
    squeezeCampRoster(playerCampRoster).activeCharacters,
    enemyCharacters,
  );
}
