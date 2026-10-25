"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ActionZone } from "@/components/game/ActionZone";
import { GameScreenShell } from "@/components/game/GameScreenShell";
import { PendingSubmitButton } from "@/components/game/PendingSubmitButton";
import { RosterSlab } from "@/components/game/RosterSlab";
import { ENEMY_TEAM, PLAYER_TEAM } from "@/lib/dummy-battle";
import { resolveBattle } from "@/lib/battle/resolveBattle";
import { useBattlePlayback } from "@/hooks/useBattlePlayback";

interface BattleScreenProps {
  returnToCampAction?: (formData: FormData) => Promise<void>;
}

export function BattleScreen({ returnToCampAction }: BattleScreenProps = {}) {
  const t = useTranslations("common");
  const resolvedBattle = useMemo(
    () => resolveBattle(PLAYER_TEAM, ENEMY_TEAM),
    [],
  );

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
        {/* Temporary marker for placeholder battle data, to be removed in
            Phase 8 together with the dummyBattleLabel key. */}
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t("dummyBattleLabel")}
        </span>
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
