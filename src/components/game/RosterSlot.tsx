import type { Character } from "@/lib/battle/types";
import { CharacterCard } from "./CharacterCard";

interface RosterSlotProps {
  character?: Character;
  facing?: "left" | "right";
  isNext?: boolean;
}

export function RosterSlot({
  character,
  facing = "right",
  isNext = false,
}: RosterSlotProps) {
  const showNextHalo = isNext && Boolean(character);

  return (
    <div className="relative">
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
      {showNextHalo && (
        <div
          className="pointer-events-none absolute -inset-2 rounded-lg border-2"
          style={{ borderColor: "var(--color-parchment-300)" }}
        >
          <span
            className="absolute left-1/2 -bottom-1.75 -translate-x-1/2 rounded-full px-1.5 py-0 text-[8px] font-bold tracking-wide uppercase"
            style={{
              backgroundColor: "var(--color-slate-300)",
              color: "var(--color-parchment-300)",
            }}
          >
            next
          </span>
        </div>
      )}
    </div>
  );
}
