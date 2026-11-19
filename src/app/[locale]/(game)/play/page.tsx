import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { BattleScreen } from "@/components/game/BattleScreen";
import { CampScreen } from "@/components/game/CampScreen";
import { GameHeader } from "@/components/game/GameHeader";
import { GameOverScreen } from "@/components/game/GameOverScreen";
import { GameScreen } from "@/components/game/GameScreen";
import { readCurrentUserId } from "@/lib/supabase/readCurrentUserId";
import { prismaGameRepository } from "@/lib/persistence/prismaGameRepository";
import { loadSavedGameForUser } from "@/lib/persistence/loadSavedGameForUser";
import { listCharacterTemplates } from "@/lib/game/characterTemplates";
import { resolveCampBattle } from "@/lib/game/resolveCampBattle";
import { storedBattleOutcome } from "@/lib/game/storedBattleOutcome";
import {
  advanceGameAction,
  buyCharacterAction,
  endRunAction,
  mergeCharacterAction,
  repositionCharacterAction,
  sellCharacterAction,
} from "../../gameActions";

// Never signs anyone in. It renders whichever screen the saved phase
// dictates — camp in campPhase, battle in battlePhase. The battle is
// resolved here, on the server, from the saved camp roster against the
// stored enemy encounter (Phase 13); it is deterministic, so a reload
// replays the identical battle.
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
            depth={savedGame.gameState.depth}
            gold={savedGame.gameState.gold}
            gamePhase={savedGame.gameState.phase}
            advanceGameAction={advanceGameAction}
          />
        }
      >
        <CampScreen
          playerCampRoster={savedGame.gameState.playerRoster}
          gold={savedGame.gameState.gold}
          characterShopSlots={savedGame.gameState.characterShopSlots}
          characterTemplates={listCharacterTemplates()}
          revision={savedGame.revision}
          buyCharacterAction={buyCharacterAction}
          repositionCharacterAction={repositionCharacterAction}
          mergeCharacterAction={mergeCharacterAction}
          sellCharacterAction={sellCharacterAction}
        />
      </GameScreen>
    );
  }

  // Present in battlePhase: buildGameStateFromLoadedRecord rejects a
  // battlePhase save without one (Phase 13).
  const enemyEncounter = savedGame.gameState.enemyEncounter;

  if (enemyEncounter === null) {
    throw new Error("A battlePhase game has no stored enemy encounter.");
  }

  const resolvedBattle = resolveCampBattle(
    savedGame.gameState.playerRoster,
    enemyEncounter,
  );

  // Decided here, on the server, from the stored battle (Phase 13): a lost
  // battle turns the header button into Continue and supplies the
  // game-over screen. The client never decides that the run is over.
  const isRunLost = storedBattleOutcome(savedGame.gameState) === "enemyWin";

  return (
    <GameScreen
      phase={savedGame.gameState.phase}
      header={
        <GameHeader
          day={savedGame.gameState.day}
          depth={savedGame.gameState.depth}
          gold={savedGame.gameState.gold}
          gamePhase={savedGame.gameState.phase}
          advanceGameAction={advanceGameAction}
          isRunLost={isRunLost}
        />
      }
      gameOverScreen={
        isRunLost ? (
          <GameOverScreen
            day={savedGame.gameState.day}
            depth={savedGame.gameState.depth}
            endRunAction={endRunAction}
          />
        ) : undefined
      }
    >
      <BattleScreen
        resolvedBattle={resolvedBattle}
        playerCampRoster={savedGame.gameState.playerRoster}
      />
    </GameScreen>
  );
}
