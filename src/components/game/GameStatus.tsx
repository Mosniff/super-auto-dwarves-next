"use client";

import { useTranslations } from "next-intl";
import { DisplayedGold } from "@/components/game/headerGoldDisplay";

interface GameStatusProps {
  day: number;
  gold: number;
  gems: number;
}

export function GameStatus({ day, gold, gems }: GameStatusProps) {
  const t = useTranslations("common");

  return (
    <div
      data-game-status
      className="flex items-center gap-4 text-parchment-50"
    >
      <span>{t("dayLabel", { day })}</span>
      <DisplayedGold gold={gold} />
      <span>{t("gemsLabel", { gems })}</span>
    </div>
  );
}
