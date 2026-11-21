"use client";

import { ActionZone } from "@/components/game/ActionZone";
import { GameScreenShell } from "@/components/game/GameScreenShell";
import { useReportPhaseAdvanceAvailability } from "@/components/game/phaseAdvanceAvailability";
import { RosterSlab } from "@/components/game/RosterSlab";
import type { ResolvedBattle } from "@/lib/battle/types";
import type { CampRoster } from "@/lib/game/campRoster";
import { useBattlePlayback } from "@/hooks/useBattlePlayback";
import { useCharacterDisplayName } from "@/components/game/characterDisplayName";
import {
  battleBoardStage,
  presentBattleBoard,
} from "@/components/game/battleBoardPresentation";

interface BattleScreenProps {
  resolvedBattle: ResolvedBattle;
  // The saved camp roster the battle was resolved from, shown as-is before
  // the first beat.
  playerCampRoster: CampRoster;
}

// The battle is resolved on the server from the saved roster and only
// played back here, so the client never computes an outcome (CLAUDE.md ->
// "Security / anti-cheat model").
export function BattleScreen({
  resolvedBattle,
  playerCampRoster,
}: BattleScreenProps) {
  const displayCharacterName = useCharacterDisplayName();
  const {
    currentState,
    currentBeatDescriptors,
    currentBeatType,
    currentBeatCharacterEffects,
    playbackBeat,
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
  } = useBattlePlayback(resolvedBattle, displayCharacterName);

  const currentBeat = {
    beatKey: playbackBeat,
    characterEffects: currentBeatCharacterEffects,
    beatType: currentBeatType,
  };

  useReportPhaseAdvanceAvailability("battlePhase", isFinished);

  const {
    playerBenchCharacters,
    playerFrontCharacter,
    enemyBenchCharacters,
    enemyFrontCharacter,
  } = presentBattleBoard({
    battleState: currentState,
    battleBoardStage: battleBoardStage(resolvedBattle.events, playbackBeat),
    playerCampRoster,
  });

  // Opening any battle "i" pauses autoplay (the human's call): the dialog
  // is modal, so manual play is already frozen, but autoplay's timer
  // would otherwise move the board behind it.
  return (
    <GameScreenShell
      gamePhase="battlePhase"
      playerBenchCharacters={playerBenchCharacters}
      presentsPlayerFrontSlotAsOnDeck
      showsPlayerInfoControls
      onPlayerInfoControlOpen={pause}
      playerCurrentBeat={currentBeat}
    >
      <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-(--battle-centre-padding)">
        <ActionZone
          playerFrontCharacter={playerFrontCharacter}
          enemyFrontCharacter={enemyFrontCharacter}
          playerDownedCharacters={currentState.player.downedCharacters}
          enemyDownedCharacters={currentState.enemy.downedCharacters}
          currentBeatDescriptors={currentBeatDescriptors}
          currentBeatType={currentBeatType}
          currentBeat={currentBeat}
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
          onInfoControlOpen={pause}
        />
      </section>
      <RosterSlab
        characters={enemyBenchCharacters}
        variant="enemy"
        presentsFrontSlotAsOnDeck
        showsInfoControls
        onInfoControlOpen={pause}
        currentBeat={currentBeat}
      />
    </GameScreenShell>
  );
}
