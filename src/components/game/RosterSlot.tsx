import type { Character } from "@/lib/battle/types";
import { CharacterCard } from "./CharacterCard";

interface RosterSlotProps {
  character?: Character;
  facing?: "left" | "right";
}

export function RosterSlot({ character, facing = "right" }: RosterSlotProps) {
  return (
    <div
      className="relative flex aspect-3/4 flex-col items-center justify-center gap-1 overflow-hidden rounded-md bg-slate-200 p-1.5"
      style={{ boxShadow: "var(--shadow-recess)" }}
    >
      {character ? (
        <CharacterCard character={character} facing={facing} />
      ) : (
        <span className="select-none text-[10px] font-medium uppercase tracking-wide text-slate-50/30">
          Empty
        </span>
      )}
    </div>
  );
}
