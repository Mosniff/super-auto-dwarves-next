import { ActiveCard } from "@/components/game/ActiveCard";
import { DiscardPile } from "@/components/game/DiscardPile";
import { InfoScroll } from "@/components/game/InfoScroll";
import type { BeatType, Character } from "@/lib/battle/types";

interface ActionZoneProps {
  playerFrontCharacter?: Character;
  enemyFrontCharacter?: Character;
  playerDownedCharacters: Character[];
  enemyDownedCharacters: Character[];
  currentBeatLines: string[];
  currentBeatType?: BeatType;
  onAdvance: () => void;
  isFinished: boolean;
  onViewPreviousBeat: () => void;
  onViewNextBeat: () => void;
  canViewPrevious: boolean;
  canViewNext: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
}

export function ActionZone({
  playerFrontCharacter,
  enemyFrontCharacter,
  playerDownedCharacters,
  enemyDownedCharacters,
  currentBeatLines,
  currentBeatType,
  onAdvance,
  isFinished,
  onViewPreviousBeat,
  onViewNextBeat,
  canViewPrevious,
  canViewNext,
  isPlaying,
  onPlay,
  onPause,
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
        />
        <div className="h-64 w-md">
          <InfoScroll
            currentBeatLines={currentBeatLines}
            onAdvance={onAdvance}
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
        />
      </div>
      <DiscardPile variant="enemy" downedCharacters={enemyDownedCharacters} />
    </div>
  );
}
