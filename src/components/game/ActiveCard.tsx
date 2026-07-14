import type { BattleCharacter } from "@/lib/battle/types";
import { CharacterCard } from "./CharacterCard";

interface ActiveCardProps {
  character?: BattleCharacter;
  facing?: "left" | "right";
}

export function ActiveCard({ character, facing = "right" }: ActiveCardProps) {
  return (
    <div
      className="relative h-64 w-48 shrink-0 overflow-hidden rounded-lg bg-slate-200 p-3"
      style={{ boxShadow: "var(--shadow-recess)" }}
    >
      {character ? (
        <CharacterCard character={character} facing={facing} variant="full" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl text-slate-50/30">
          —
        </div>
      )}
    </div>
  );
}
