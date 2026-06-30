import Image from "next/image";
import type { DummyCharacter } from "@/lib/dummy-battle";

interface CharacterCardProps {
  character: DummyCharacter;
  facing?: "left" | "right";
  variant?: "compact" | "full";
}

const VARIANT_STYLES = {
  compact: {
    gap: "gap-1",
    name: "text-[10px]",
    stats: "text-[10px] px-0.5",
    portraitRounding: "rounded-sm",
  },
  full: {
    gap: "gap-2",
    name: "text-base",
    stats: "text-sm px-1",
    portraitRounding: "rounded-md",
  },
} as const;

export function CharacterCard({
  character,
  facing = "right",
  variant = "compact",
}: CharacterCardProps) {
  const styles = VARIANT_STYLES[variant];

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
        <span>♥ {character.health}</span>
      </div>
    </div>
  );
}
