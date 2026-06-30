import { ActionZone } from "@/components/game/ActionZone";
import { RosterSlab } from "@/components/game/RosterSlab";
import { ENEMY_TEAM } from "@/lib/dummy-battle";

export default function PlayPage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-1 items-center justify-center p-6">
        <ActionZone />
      </section>
      <RosterSlab characters={ENEMY_TEAM} variant="enemy" />
    </main>
  );
}
