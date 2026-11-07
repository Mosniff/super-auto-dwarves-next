"use client";

import { useTranslations } from "next-intl";
import { ActionZone } from "@/components/game/ActionZone";
import { GameScreenShell } from "@/components/game/GameScreenShell";
import { PendingSubmitButton } from "@/components/game/PendingSubmitButton";
import { RosterSlab } from "@/components/game/RosterSlab";
import type { ResolvedBattle } from "@/lib/battle/types";
import { useBattlePlayback } from "@/hooks/useBattlePlayback";

interface BattleScreenProps {
  resolvedBattle: ResolvedBattle;
  returnToCampAction?: (formData: FormData) => Promise<void>;
}

// The battle is resolved on the server from the saved roster and only
// played back here, so the client never computes an outcome (CLAUDE.md ->
// "Security / anti-cheat model").
export function BattleScreen({
  resolvedBattle,
  returnToCampAction,
}: BattleScreenProps) {
  const t = useTranslations("common");

  const {
    currentState,
    currentBeatDescriptors,
    currentBeatType,
    isFinished,
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

  return (
    <GameScreenShell
      playerBenchCharacters={currentState.player.activeCharacters.slice(1)}
    >
      <section className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <ActionZone
          playerFrontCharacter={currentState.player.activeCharacters[0]}
          enemyFrontCharacter={currentState.enemy.activeCharacters[0]}
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
      <RosterSlab
        characters={currentState.enemy.activeCharacters.slice(1)}
        variant="enemy"
      />
    </GameScreenShell>
  );
}
