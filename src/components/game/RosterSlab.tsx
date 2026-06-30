import type { DummyCharacter } from "@/lib/dummy-battle";
import { RosterSlot } from "./RosterSlot";

const SLOT_COUNT = 7;

interface RosterSlabProps {
  characters: DummyCharacter[];
  variant?: "player" | "enemy";
}

export function RosterSlab({ characters, variant = "player" }: RosterSlabProps) {
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => characters[i]);
  const facing = variant === "enemy" ? "left" : "right";

  return (
    <div className="w-full bg-linear-to-b from-marble-100 via-marble-200 to-marble-300 px-5 py-4">
      <div
        className={`mx-auto flex max-w-5xl gap-3 ${
          variant === "player" ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {slots.map((character, i) => (
          <div key={character?.id ?? i} className="flex-1">
            <RosterSlot character={character} facing={facing} />
          </div>
        ))}
      </div>
    </div>
  );
}
