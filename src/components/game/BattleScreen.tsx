"use client";

import { useTranslations } from "next-intl";
import { ActionZone } from "@/components/game/ActionZone";
import { GameScreenShell } from "@/components/game/GameScreenShell";
import { PendingSubmitButton } from "@/components/game/PendingSubmitButton";
import { RosterSlab } from "@/components/game/RosterSlab";
import type { ResolvedBattle } from "@/lib/battle/types";
import type { CampRoster } from "@/lib/game/campRoster";
import { useBattlePlayback } from "@/hooks/useBattlePlayback";
import { presentBattleBoard } from "@/components/game/battleBoardPresentation";

interface BattleScreenProps {
  resolvedBattle: ResolvedBattle;
  // The saved camp roster the battle was resolved from, shown as-is before
  // the first beat.
  playerCampRoster: CampRoster;
  returnToCampAction?: (formData: FormData) => Promise<void>;
}

// The battle is resolved on the server from the saved roster and only
// played back here, so the client never computes an outcome (CLAUDE.md ->
// "Security / anti-cheat model").
export function BattleScreen({
  resolvedBattle,
  playerCampRoster,
  returnToCampAction,
}: BattleScreenProps) {
  const t = useTranslations("common");

  const {
    currentState,
    currentBeatDescriptors,
    currentBeatType,
    isFinished,
    hasBattleStarted,
    advance,
    canAdvance,
    viewPreviousBeat,
    viewNextBeat,
    canViewPrevious,
    canViewNext,
    isPlaying,
    play,
    pause,
  } = useBattlePlayback(resolvedBattle);

  const {
    playerBenchCharacters,
    playerFrontCharacter,
    enemyBenchCharacters,
    enemyFrontCharacter,
  } = presentBattleBoard({
    battleState: currentState,
    hasBattleStarted,
    playerCampRoster,
  });

  return (
    <GameScreenShell playerBenchCharacters={playerBenchCharacters}>
      <section className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <ActionZone
          playerFrontCharacter={playerFrontCharacter}
          enemyFrontCharacter={enemyFrontCharacter}
          playerDownedCharacters={currentState.player.downedCharacters}
          enemyDownedCharacters={currentState.enemy.downedCharacters}
          currentBeatDescriptors={currentBeatDescriptors}
          currentBeatType={currentBeatType}
          onAdvance={advance}
          canAdvance={canAdvance}
          isFinished={isFinished}
          onViewPreviousBeat={viewPreviousBeat}
          onViewNextBeat={viewNextBeat}
          canViewPrevious={canViewPrevious}
          canViewNext={canViewNext}
          isPlaying={isPlaying}
          onPlay={play}
          onPause={pause}
        />
        {isFinished && returnToCampAction && (
          <form action={returnToCampAction}>
            <input
              type="hidden"
              name="expectedCurrentPhase"
              value="battlePhase"
            />
            <PendingSubmitButton size="lg">
              {t("returnToCamp")}
            </PendingSubmitButton>
          </form>
        )}
      </section>
      <RosterSlab characters={enemyBenchCharacters} variant="enemy" />
    </GameScreenShell>
  );
}
