import { ActiveCard } from "@/components/game/ActiveCard";
import { InfoScroll } from "@/components/game/InfoScroll";
import type { BattleCharacter } from "@/lib/battle/types";

interface ActionZoneProps {
  playerFrontCharacter?: BattleCharacter;
  enemyFrontCharacter?: BattleCharacter;
  logLines: string[];
  onAdvance: () => void;
  isFinished: boolean;
}

export function ActionZone({
  playerFrontCharacter,
  enemyFrontCharacter,
  logLines,
  onAdvance,
  isFinished,
}: ActionZoneProps) {
  return (
    <div className="flex w-full items-center justify-center gap-8">
      <ActiveCard character={playerFrontCharacter} facing="right" />
      <div className="h-64 max-w-md flex-1">
        <InfoScroll
          logLines={logLines}
          onAdvance={onAdvance}
          isFinished={isFinished}
        />
      </div>
      <ActiveCard character={enemyFrontCharacter} facing="left" />
    </div>
  );
}
