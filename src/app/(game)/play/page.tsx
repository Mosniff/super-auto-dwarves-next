import { ActiveCard } from "@/components/game/ActiveCard";
import { RosterSlab } from "@/components/game/RosterSlab";
import { ENEMY_TEAM, PLAYER_TEAM } from "@/lib/dummy-battle";

export default function PlayPage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-1 items-center justify-center p-6">
        <div className="flex items-center justify-center gap-8">
          <ActiveCard character={PLAYER_TEAM[0]} facing="right" />
          <ActiveCard character={ENEMY_TEAM[0]} facing="left" />
        </div>
      </section>
      <RosterSlab characters={ENEMY_TEAM} variant="enemy" />
    </main>
  );
}
