import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { BattleScreen } from "@/components/game/BattleScreen";
import { CampScreen } from "@/components/game/CampScreen";
import { readCurrentUserId } from "@/lib/supabase/readCurrentUserId";
import { prismaGameRepository } from "@/lib/persistence/prismaGameRepository";
import { loadSavedGameForUser } from "@/lib/persistence/loadSavedGameForUser";
import { advanceGameAction } from "../../gameActions";

// Never signs anyone in. It renders whichever screen the saved phase
// dictates — camp in campPhase, battle in battlePhase. The battle still
// uses dummy data until Phase 8.
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
      <CampScreen
        playerRosterCharacters={
          savedGame.gameState.playerRoster.activeCharacters
        }
        day={savedGame.gameState.day}
        gold={savedGame.gameState.gold}
        advanceGameAction={advanceGameAction}
      />
    );
  }

  return <BattleScreen returnToCampAction={advanceGameAction} />;
}
