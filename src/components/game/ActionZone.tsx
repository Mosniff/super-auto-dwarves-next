import { ActiveCard } from "@/components/game/ActiveCard";
import { InfoScroll } from "@/components/game/InfoScroll";
import type { BattleEventDescriptor, BeatType } from "@/lib/battle/types";
import type { CurrentBeatEffects } from "@/lib/battle/beatCharacterEffects";
import type { Character } from "@/lib/game/character";

interface ActionZoneProps {
  playerFrontCharacter?: Character;
  enemyFrontCharacter?: Character;
  currentBeatDescriptors: BattleEventDescriptor[];
  currentBeatType?: BeatType;
  // Phase 12 battle beat animations; display-only.
  currentBeat?: CurrentBeatEffects;
  onInfoControlOpen?: () => void;
  // the info scroll's viewed position (Phase 14)
  viewedTurn?: number;
  viewedBeat?: number;
}

export function ActionZone({
  playerFrontCharacter,
  enemyFrontCharacter,
  currentBeatDescriptors,
  currentBeatType,
  currentBeat,
  onInfoControlOpen,
  viewedTurn,
  viewedBeat,
}: ActionZoneProps) {
  // The downed piles are hidden for now (Phase 14) and will return:
  // DiscardPile.tsx is kept, and the battle state still carries
  // downedCharacters.
  return (
    <div className="flex w-full items-center justify-center">
      <div className="flex items-center justify-center gap-(--action-zone-gap)">
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
            viewedTurn={viewedTurn}
            viewedBeat={viewedBeat}
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
    </div>
  );
}
