import { ActionZone } from "@/components/game/ActionZone";
import { GameScreenShell } from "@/components/game/GameScreenShell";
import { RosterSlab } from "@/components/game/RosterSlab";
import { ENEMY_TEAM, PLAYER_TEAM } from "@/lib/dummy-battle";

export default function PlayPage() {
  return (
    <GameScreenShell playerCharacters={PLAYER_TEAM}>
      <section className="flex flex-1 items-center justify-center p-6">
        <ActionZone />
      </section>
      <RosterSlab characters={ENEMY_TEAM} variant="enemy" />
    </GameScreenShell>
  );
}
