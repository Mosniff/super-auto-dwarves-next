import type { BattleCharacter } from "@/lib/battle/types";
import { CharacterCard } from "./CharacterCard";

interface ActiveCardProps {
  character: BattleCharacter;
  facing?: "left" | "right";
}

export function ActiveCard({ character, facing = "right" }: ActiveCardProps) {
  return (
    <div
      className="relative aspect-3/4 w-48 overflow-hidden rounded-lg bg-slate-200 p-3"
      style={{ boxShadow: "var(--shadow-recess)" }}
    >
      <CharacterCard character={character} facing={facing} variant="full" />
    </div>
  );
}
