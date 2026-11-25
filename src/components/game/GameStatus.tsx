"use client";

import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import type { GamePhase } from "@/lib/game/types";

interface GameStatusProps {
  day: number;
  gamePhase: GamePhase;
}

// The header's centre (Phase 16): only the day, in the battle opening's
// Cinzel display face, with a sun beside it at camp (the day) and a moon
// in battle (the night). The gold lives on camp's money pile; the depth
// and the placeholder gem count left the header. Every size and colour is
// a globals.css variable ("Phase 16 header flare").
export function GameStatus({ day, gamePhase }: GameStatusProps) {
  const t = useTranslations("common");
  const phaseIconName = gamePhase === "campPhase" ? "sun" : "moon";
  const PhaseIcon = phaseIconName === "sun" ? Sun : Moon;

  return (
    <span
      data-game-status
      data-game-status-phase-icon={phaseIconName}
      className="flex items-center gap-(--header-day-icon-gap)"
    >
      <PhaseIcon aria-hidden="true" data-game-status-icon />
      <span data-game-status-day>{t("dayLabel", { day })}</span>
    </span>
  );
}
