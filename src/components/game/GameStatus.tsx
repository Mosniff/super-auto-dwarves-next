"use client";

import { useTranslations } from "next-intl";

interface GameStatusProps {
  day: number;
  gold: number;
}

export function GameStatus({ day, gold }: GameStatusProps) {
  const t = useTranslations("common");

  return (
    <div
      data-game-status
      className="flex items-center gap-4 text-parchment-50"
    >
      <span>{t("dayLabel", { day })}</span>
      <span>{t("goldLabel", { gold })}</span>
    </div>
  );
}
