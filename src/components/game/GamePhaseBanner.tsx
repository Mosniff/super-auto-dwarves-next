"use client";

import { useTranslations } from "next-intl";
import type { GamePhase } from "@/lib/game/types";
import { motion } from "motion/react";

interface GamePhaseBannerProps {
  gamePhase: GamePhase;
  // A screen that shows no banner (battle, Phase 14) still needs its one
  // page heading for screen readers: the phase name as a visually hidden h1.
  isVisuallyHidden?: boolean;
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
export function GamePhaseBanner({
  gamePhase,
  isVisuallyHidden = false,
}: GamePhaseBannerProps) {
  const t = useTranslations("common");

  if (isVisuallyHidden) {
    return (
      <h1 className="sr-only">{t(GAME_PHASE_TRANSLATION_KEYS[gamePhase])}</h1>
    );
  }

  return (
    <div data-game-phase-banner={gamePhase} className="flex justify-center">
      <h1
        className="w-full flex h-(--phase-banner-height) items-center justify-center px-16 text-(length:--phase-banner-font-size) font-bold uppercase tracking-widest text-(--color-parchment-50) [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]"
        style={{
          background: "var(--texture-phase-banner)",
          clipPath:
            "polygon(0 0, 100% 0, calc(100% - var(--phase-banner-slant)) 100%, var(--phase-banner-slant) 100%)",
        }}
      >
        <motion.span
          className="block"
          initial={{ x: "100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        >
          {t(GAME_PHASE_TRANSLATION_KEYS[gamePhase])}
        </motion.span>
      </h1>
    </div>
  );
}
