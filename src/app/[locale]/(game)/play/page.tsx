import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { BattleScreen } from "@/components/game/BattleScreen";
import { CampScreen } from "@/components/game/CampScreen";
import { GameHeader } from "@/components/game/GameHeader";
import { GameScreen } from "@/components/game/GameScreen";
import { readCurrentUserId } from "@/lib/supabase/readCurrentUserId";
import { prismaGameRepository } from "@/lib/persistence/prismaGameRepository";
import { loadSavedGameForUser } from "@/lib/persistence/loadSavedGameForUser";
import { listCharacterTemplates } from "@/lib/game/characterTemplates";
import { DUMMY_ENEMY_ROSTER } from "@/lib/game/dummyEnemyRoster";
import { resolveCampBattle } from "@/lib/game/resolveCampBattle";
import {
  advanceGameAction,
  buyCharacterAction,
  repositionCharacterAction,
} from "../../gameActions";

// Never signs anyone in. It renders whichever screen the saved phase
// dictates — camp in campPhase, battle in battlePhase. The battle is
// resolved here, on the server, from the saved camp roster against the
// placeholder enemy; it is deterministic, so a reload replays the
// identical battle and nothing battle-derived is stored.
export default async function PlayPage() {
  const userId = await readCurrentUserId();

  if (userId === null) {
    const locale = await getLocale();
    redirect({ href: "/", locale });
    return;
  }

  const savedGame = await loadSavedGameForUser(userId, prismaGameRepository);

  if (savedGame === null) {
    const locale = await getLocale();
    redirect({ href: "/saves", locale });
    return;
  }

  if (savedGame.gameState.phase === "campPhase") {
    return (
      <GameScreen
        phase={savedGame.gameState.phase}
        header={
          <GameHeader
            day={savedGame.gameState.day}
            gold={savedGame.gameState.gold}
          />
        }
      >
        <CampScreen
          playerCampRoster={savedGame.gameState.playerRoster}
          gold={savedGame.gameState.gold}
          characterShopSlots={savedGame.gameState.characterShopSlots}
          characterTemplates={listCharacterTemplates()}
          revision={savedGame.revision}
          advanceGameAction={advanceGameAction}
          buyCharacterAction={buyCharacterAction}
          repositionCharacterAction={repositionCharacterAction}
        />
      </GameScreen>
    );
  }

  const resolvedBattle = resolveCampBattle(
    savedGame.gameState.playerRoster,
    DUMMY_ENEMY_ROSTER,
  );

  return (
    <GameScreen
      phase={savedGame.gameState.phase}
      header={
        <GameHeader
          day={savedGame.gameState.day}
          gold={savedGame.gameState.gold}
        />
      }
    >
      <BattleScreen
        resolvedBattle={resolvedBattle}
        playerCampRoster={savedGame.gameState.playerRoster}
        returnToCampAction={advanceGameAction}
      />
    </GameScreen>
  );
}
