import Image from "next/image";
import type { Character } from "@/lib/battle/types";
import { hpBarFillRatio } from "@/lib/battle/hpBarFillRatio";

interface CharacterCardProps {
  character: Character;
  facing?: "left" | "right";
  variant?: "compact" | "full";
}

const VARIANT_STYLES = {
  compact: {
    gap: "gap-1",
    name: "text-[10px]",
    stats: "text-[10px] px-0.5",
    portraitRounding: "rounded-sm",
    hpBarText: "text-[9px]",
  },
  full: {
    gap: "gap-2",
    name: "text-base",
    stats: "text-sm px-1",
    portraitRounding: "rounded-md",
    hpBarText: "text-[11px]",
  },
} as const;

export function CharacterCard({
  character,
  facing = "right",
  variant = "compact",
}: CharacterCardProps) {
  const styles = VARIANT_STYLES[variant];
  const hpFillRatio = hpBarFillRatio(character.hp, character.maxHp);

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center ${styles.gap}`}
    >
      <div
        className={`relative w-full flex-1 overflow-hidden bg-slate-300 ${styles.portraitRounding}`}
        style={facing === "left" ? { transform: "scaleX(-1)" } : undefined}
      >
        <Image
          src="/character_portraits/placeholder.png"
          alt={character.name}
          fill
          className="object-cover"
          sizes="250px"
          quality={90}
          priority
        />
      </div>
      <span
        className={`w-full truncate text-center font-medium text-slate-50 ${styles.name}`}
      >
        {character.name}
      </span>
      <div
        className={`flex w-full items-center justify-between font-semibold text-slate-50 ${styles.stats}`}
      >
        <span>⚔ {character.attack}</span>
        <div className="relative ml-1 h-3 flex-1 overflow-hidden rounded-full bg-slate-400/40">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-out"
            style={{ width: `${hpFillRatio * 100}%` }}
          />
          <span
            className={`absolute inset-0 flex items-center justify-center font-semibold text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.6)] ${styles.hpBarText}`}
          >
            {character.hp}/{character.maxHp}
          </span>
        </div>
      </div>
    </div>
  );
}
