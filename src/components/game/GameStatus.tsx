"use client";

import { useTranslations } from "next-intl";

interface GameStatusProps {
  day: number;
}

// The header's centre (Phase 16): only the day. The gold lives on camp's
// money pile; the depth and the placeholder gem count left the header.
export function GameStatus({ day }: GameStatusProps) {
  const t = useTranslations("common");

  return (
    <span data-game-status className="text-lg text-parchment-50">
      {t("dayLabel", { day })}
    </span>
  );
}
