"use client";

import { useTranslations } from "next-intl";
import type { GamePhase } from "@/lib/game/types";

interface GamePhaseBannerProps {
  gamePhase: GamePhase;
}

const GAME_PHASE_TRANSLATION_KEYS: Record<
  GamePhase,
  "phaseCamp" | "phaseBattle"
> = {
  campPhase: "phaseCamp",
  battlePhase: "phaseBattle",
};

// A hanging-tab trapezoid cut by clip-path, so the gold stripes (part of
// --texture-phase-banner) are cut along the same diagonals. Horizontal
// padding must stay larger than the slant so text is never clipped.
export function GamePhaseBanner({ gamePhase }: GamePhaseBannerProps) {
  const t = useTranslations("common");

  return (
    <div data-game-phase-banner={gamePhase} className="flex justify-center">
      <h1
        className="px-16 py-2 w-full text-center text-lg font-bold uppercase tracking-widest text-(--color-parchment-50) [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]"
        style={{
          background: "var(--texture-phase-banner)",
          clipPath:
            "polygon(0 0, 100% 0, calc(100% - var(--phase-banner-slant)) 100%, var(--phase-banner-slant) 100%)",
        }}
      >
        {t(GAME_PHASE_TRANSLATION_KEYS[gamePhase])}
      </h1>
    </div>
  );
}
