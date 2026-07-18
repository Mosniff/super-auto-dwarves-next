"use client";

import { useMemo } from "react";
import { ActionZone } from "@/components/game/ActionZone";
import { GameScreenShell } from "@/components/game/GameScreenShell";
import { RosterSlab } from "@/components/game/RosterSlab";
import { ENEMY_TEAM, PLAYER_TEAM } from "@/lib/dummy-battle";
import { resolveBattle } from "@/lib/battle/resolveBattle";
import { useBattlePlayback } from "@/hooks/useBattlePlayback";

export function BattleScreen() {
  const resolvedBattle = useMemo(
    () => resolveBattle(PLAYER_TEAM, ENEMY_TEAM),
    [],
  );

  const {
    currentState,
    currentBeatLines,
    currentBeatType,
    isFinished,
    advance,
    viewPreviousBeat,
    viewNextBeat,
    canViewPrevious,
    canViewNext,
    isPlaying,
    play,
    pause,
  } = useBattlePlayback(resolvedBattle);

  return (
    <GameScreenShell playerCharacters={currentState.player.activeCharacters}>
      <section className="flex flex-1 items-center justify-center p-6">
        <ActionZone
          playerFrontCharacter={currentState.player.activeCharacters[0]}
          enemyFrontCharacter={currentState.enemy.activeCharacters[0]}
          playerDownedCharacters={currentState.player.downedCharacters}
          enemyDownedCharacters={currentState.enemy.downedCharacters}
          currentBeatLines={currentBeatLines}
          currentBeatType={currentBeatType}
          onAdvance={advance}
          isFinished={isFinished}
          onViewPreviousBeat={viewPreviousBeat}
          onViewNextBeat={viewNextBeat}
          canViewPrevious={canViewPrevious}
          canViewNext={canViewNext}
          isPlaying={isPlaying}
          onPlay={play}
          onPause={pause}
        />
      </section>
      <RosterSlab
        characters={currentState.enemy.activeCharacters}
        variant="enemy"
      />
    </GameScreenShell>
  );
}
