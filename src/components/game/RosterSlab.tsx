import type { Character } from "@/lib/battle/types";
import { RosterSlot } from "./RosterSlot";

const SLOT_COUNT = 7;

interface RosterSlabProps {
  characters: Character[];
  variant?: "player" | "enemy";
}

export function RosterSlab({
  characters,
  variant = "player",
}: RosterSlabProps) {
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => characters[i]);
  const facing = variant === "enemy" ? "left" : "right";

  return (
    <div className="w-full bg-linear-to-b from-slate-100 via-slate-200 to-slate-300 px-5 py-4">
      <div
        className={`mx-auto flex max-w-5xl gap-3 ${
          variant === "player" ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {slots.map((character, i) => (
          <div key={character?.id ?? i} className="flex-1">
            <RosterSlot
              character={character}
              facing={facing}
              isNext={i === 0 && Boolean(character)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
