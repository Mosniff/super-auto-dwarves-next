import Image from "next/image";
import type { Character } from "@/lib/battle/types";
import { hpBarFillRatio } from "@/lib/battle/hpBarFillRatio";

interface CharacterCardProps {
  character: Character;
  facing?: "left" | "right";
  variant?: "compact" | "full";
  animateHpDrop?: boolean;
}

// Tuned by eye later by the human.
const HP_DRAIN_DELAY_MS = 250; // bar holds full, then drains ~at clash impact
const HP_DRAIN_TRANSITION_MS = 300; // existing bar drain duration
// Total number fade envelope; comfortably exceeds delay+drain so the number
// is hidden across the whole drain (containment, not precise alignment).
const HP_NUMBER_FADE_MS = 700;

const VARIANT_STYLES = {
  compact: {
    gap: "gap-1",
    name: "text-[10px]",
    stats: "text-[10px] px-0.5",
    portraitRounding: "rounded-sm",
    hpBarText: "text-[9px]",
    downedLabelText: "text-[9px]",
  },
  full: {
    gap: "gap-2",
    name: "text-base",
    stats: "text-sm px-1",
    portraitRounding: "rounded-md",
    hpBarText: "text-[11px]",
    downedLabelText: "text-sm",
  },
} as const;

export function CharacterCard({
  character,
  facing = "right",
  variant = "compact",
  animateHpDrop = false,
}: CharacterCardProps) {
  const styles = VARIANT_STYLES[variant];
  const hpFillRatio = hpBarFillRatio(character.hp, character.maxHp);
  const isDowned = character.hp <= 0;

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center ${styles.gap}`}
    >
      <div
        className={`relative w-full flex-1 overflow-hidden bg-slate-300 ${styles.portraitRounding}`}
      >
        <div
          className="absolute inset-0"
          style={facing === "left" ? { transform: "scaleX(-1)" } : undefined}
        >
          <Image
            src="/character_portraits/placeholder.png"
            alt={character.name}
            fill
            className={`object-cover transition-[filter,opacity] duration-200 ease-out ${
              isDowned ? "grayscale brightness-75" : ""
            }`}
            sizes="250px"
            quality={90}
            priority
          />
        </div>
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/50 font-bold tracking-wide text-white uppercase transition-opacity duration-200 ease-out ${
            isDowned ? "opacity-100" : "opacity-0"
          } ${styles.downedLabelText}`}
        >
          Downed
        </div>
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
            className="h-full rounded-full bg-emerald-500 transition-[width] ease-out"
            style={{
              width: `${hpFillRatio * 100}%`,
              transitionDuration: `${HP_DRAIN_TRANSITION_MS}ms`,
              transitionDelay: animateHpDrop ? `${HP_DRAIN_DELAY_MS}ms` : "0ms",
            }}
          />
          <span
            className={`absolute inset-0 flex items-center justify-center font-semibold text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.6)] ${styles.hpBarText}`}
            // Re-triggers on every animateHpDrop false->true transition, same
            // assumption as the ActiveCard clash re-trigger: a non-clash beat
            // separates consecutive clashes, so the style (and thus the
            // animation) is removed then re-applied each time.
            style={{
              animation: animateHpDrop
                ? `hp-number-drop-fade ${HP_NUMBER_FADE_MS}ms ease-in-out`
                : undefined,
            }}
          >
            {character.hp}/{character.maxHp}
          </span>
        </div>
      </div>
    </div>
  );
}
