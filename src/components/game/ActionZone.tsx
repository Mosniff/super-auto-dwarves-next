import { ActiveCard } from "@/components/game/ActiveCard";
import { DiscardPile } from "@/components/game/DiscardPile";
import { InfoScroll } from "@/components/game/InfoScroll";
import type { BattleEventDescriptor, BeatType } from "@/lib/battle/types";
import type { CurrentBeatEffects } from "@/lib/battle/beatCharacterEffects";
import type { Character } from "@/lib/game/character";

interface ActionZoneProps {
  playerFrontCharacter?: Character;
  enemyFrontCharacter?: Character;
  playerDownedCharacters: Character[];
  enemyDownedCharacters: Character[];
  currentBeatDescriptors: BattleEventDescriptor[];
  currentBeatType?: BeatType;
  // Phase 12 battle beat animations; display-only.
  currentBeat?: CurrentBeatEffects;
  onAdvance: () => void;
  canAdvance: boolean;
  isFinished: boolean;
  onViewPreviousBeat: () => void;
  onViewNextBeat: () => void;
  canViewPrevious: boolean;
  canViewNext: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onInfoControlOpen?: () => void;
}

export function ActionZone({
  playerFrontCharacter,
  enemyFrontCharacter,
  playerDownedCharacters,
  enemyDownedCharacters,
  currentBeatDescriptors,
  currentBeatType,
  currentBeat,
  onAdvance,
  canAdvance,
  isFinished,
  onViewPreviousBeat,
  onViewNextBeat,
  canViewPrevious,
  canViewNext,
  isPlaying,
  onPlay,
  onPause,
  onInfoControlOpen,
}: ActionZoneProps) {
  return (
    <div className="flex w-full items-center justify-between">
      <DiscardPile
        variant="player"
        downedCharacters={playerDownedCharacters}
      />
      <div className="flex items-center justify-center gap-8">
        <ActiveCard
          character={playerFrontCharacter}
          facing="right"
          currentBeatType={currentBeatType}
          currentBeat={currentBeat}
          onInfoControlOpen={onInfoControlOpen}
        />
        <div className="h-(--info-scroll-height) w-(--info-scroll-width)">
          <InfoScroll
            currentBeatDescriptors={currentBeatDescriptors}
            onAdvance={onAdvance}
            canAdvance={canAdvance}
            isFinished={isFinished}
            onViewPreviousBeat={onViewPreviousBeat}
            onViewNextBeat={onViewNextBeat}
            canViewPrevious={canViewPrevious}
            canViewNext={canViewNext}
            isPlaying={isPlaying}
            onPlay={onPlay}
            onPause={onPause}
          />
        </div>
        <ActiveCard
          character={enemyFrontCharacter}
          facing="left"
          currentBeatType={currentBeatType}
          currentBeat={currentBeat}
          onInfoControlOpen={onInfoControlOpen}
        />
      </div>
      <DiscardPile variant="enemy" downedCharacters={enemyDownedCharacters} />
    </div>
  );
}
