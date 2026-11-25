"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { ActionZone } from "@/components/game/ActionZone";
import { GameScreenShell } from "@/components/game/GameScreenShell";
import { useReportPhaseAdvanceAvailability } from "@/components/game/phaseAdvanceAvailability";
import { RosterSlab } from "@/components/game/RosterSlab";
import type { ResolvedBattle } from "@/lib/battle/types";
import { resolvedBattleFactionIds } from "@/lib/battle/resolvedBattleFactionIds";
import type { CampRoster } from "@/lib/game/campRoster";
import { useBattlePlayback } from "@/hooks/useBattlePlayback";
import { BattleAutoplayControl } from "@/components/game/BattleAutoplayControl";
import {
  readAutoplaySpeedPreference,
  writeAutoplaySpeedPreference,
} from "@/components/game/autoplaySpeedPreference";
import type { AutoplaySpeed } from "@/lib/battle/autoplaySpeed";
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

// useSyncExternalStore's server/client snapshots give a hydration-safe
// "has mounted" flag; there is nothing to subscribe to.
function subscribeToNothing() {
  return () => {};
}

// The battle is resolved on the server from the saved roster and only
// played back here, so the client never computes an outcome (CLAUDE.md ->
// "Security / anti-cheat model").
export function BattleScreen({
  resolvedBattle,
  playerCampRoster,
}: BattleScreenProps) {
  const displayCharacterName = useCharacterDisplayName();
  const translateFaction = useTranslations("faction");
  const battleFactionIds = resolvedBattleFactionIds(resolvedBattle);
  const {
    currentState,
    currentBeatDescriptors,
    currentBeatType,
    currentBeatCharacterEffects,
    playbackBeat,
    isFinished,
    advance,
    canAdvance,
    pause,
    autoplaySpeed,
    setAutoplaySpeed,
    viewedTurn,
    viewedBeat,
  } = useBattlePlayback(resolvedBattle, displayCharacterName);

  const currentBeat = {
    beatKey: playbackBeat,
    characterEffects: currentBeatCharacterEffects,
    beatType: currentBeatType,
  };

  useReportPhaseAdvanceAvailability("battlePhase", isFinished);

  // The remembered autoplay speed (Phase 14) can't be known on the server,
  // so until the page has mounted no speed shows as pressed (no flash of
  // Off). It is read in a layout effect, before the first client paint.
  const hasMounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  useLayoutEffect(() => {
    const rememberedAutoplaySpeed = readAutoplaySpeedPreference();
    if (rememberedAutoplaySpeed !== "off") {
      setAutoplaySpeed(rememberedAutoplaySpeed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, []);

  // Only the player's own choice is remembered; the "i" pause switches
  // autoplay off without changing the preference; at the battle's end the
  // chosen speed simply stays selected.
  const chooseAutoplaySpeed = (chosenAutoplaySpeed: AutoplaySpeed) => {
    setAutoplaySpeed(chosenAutoplaySpeed);
    writeAutoplaySpeedPreference(chosenAutoplaySpeed);
  };

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
      alignsPlayerRosterSlotsTowardFront
      playerRosterFactionLabel={
        battleFactionIds === undefined
          ? undefined
          : translateFaction(`${battleFactionIds.playerFactionId}.pluralName`)
      }
      playerRosterLeadingControls={
        <BattleAutoplayControl
          autoplaySpeed={autoplaySpeed}
          onAutoplaySpeedChange={chooseAutoplaySpeed}
          onAdvance={advance}
          canAdvance={canAdvance}
          isAutoplaySpeedKnown={hasMounted}
        />
      }
    >
      <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-(--battle-centre-padding)">
        <ActionZone
          playerFrontCharacter={playerFrontCharacter}
          enemyFrontCharacter={enemyFrontCharacter}
          currentBeatDescriptors={currentBeatDescriptors}
          currentBeatType={currentBeatType}
          currentBeat={currentBeat}
          onInfoControlOpen={pause}
          viewedTurn={viewedTurn}
          viewedBeat={viewedBeat}
        />
      </section>
      <RosterSlab
        characters={enemyBenchCharacters}
        variant="enemy"
        factionLabel={
          battleFactionIds === undefined
            ? undefined
            : translateFaction(`${battleFactionIds.enemyFactionId}.pluralName`)
        }
        alignsSlotsTowardFront
        presentsFrontSlotAsOnDeck
        showsInfoControls
        onInfoControlOpen={pause}
        currentBeat={currentBeat}
      />
    </GameScreenShell>
  );
}
