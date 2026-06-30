import { ActiveCard } from "@/components/game/ActiveCard";
import { InfoScroll } from "@/components/game/InfoScroll";
import { ENEMY_TEAM, PLAYER_TEAM } from "@/lib/dummy-battle";

export function ActionZone() {
  return (
    <div className="flex h-full w-full items-stretch justify-center gap-8">
      <ActiveCard character={PLAYER_TEAM[0]} facing="right" />
      <div className="max-w-md flex-1">
        <InfoScroll />
      </div>
      <ActiveCard character={ENEMY_TEAM[0]} facing="left" />
    </div>
  );
}
