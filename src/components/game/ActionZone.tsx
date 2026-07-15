import { ActiveCard } from "@/components/game/ActiveCard";
import { InfoScroll } from "@/components/game/InfoScroll";
import type { BattleCharacter } from "@/lib/battle/types";

interface ActionZoneProps {
  playerFrontCharacter?: BattleCharacter;
  enemyFrontCharacter?: BattleCharacter;
  currentBeatLines: string[];
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
  currentBeatLines,
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
    <div className="flex w-full items-center justify-center gap-8">
      <ActiveCard character={playerFrontCharacter} facing="right" />
      <div className="h-64 max-w-md flex-1">
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
      <ActiveCard character={enemyFrontCharacter} facing="left" />
    </div>
  );
}
