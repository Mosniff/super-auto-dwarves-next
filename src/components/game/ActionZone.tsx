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
  onViewPreviousBeat: () => void;
  onViewNextBeat: () => void;
  canViewPrevious: boolean;
  canViewNext: boolean;
  isPlaying: boolean;
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
  onViewPreviousBeat,
  onViewNextBeat,
  canViewPrevious,
  canViewNext,
  isPlaying,
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
            onViewPreviousBeat={onViewPreviousBeat}
            onViewNextBeat={onViewNextBeat}
            canViewPrevious={canViewPrevious}
            canViewNext={canViewNext}
            isPlaying={isPlaying}
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
