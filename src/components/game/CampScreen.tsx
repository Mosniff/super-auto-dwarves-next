"use client";

import { useTranslations } from "next-intl";
import { GameScreenShell } from "@/components/game/GameScreenShell";
import { PendingSubmitButton } from "@/components/game/PendingSubmitButton";
import type { Character } from "@/lib/battle/types";

interface CampScreenProps {
  playerRosterCharacters: Character[];
  day: number;
  gold: number;
  advanceGameAction: (formData: FormData) => Promise<void>;
}

export function CampScreen({
  playerRosterCharacters,
  day,
  gold,
  advanceGameAction,
}: CampScreenProps) {
  const t = useTranslations("common");

  return (
    <GameScreenShell playerBenchCharacters={playerRosterCharacters}>
      <section className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-bold">{t("phaseCamp")}</h1>
        <p className="text-muted-foreground">
          {t("dayLabel", { day })} — {t("goldLabel", { gold })}
        </p>
        <form action={advanceGameAction}>
          <input type="hidden" name="expectedCurrentPhase" value="campPhase" />
          <PendingSubmitButton size="lg">{t("toBattle")}</PendingSubmitButton>
        </form>
      </section>
    </GameScreenShell>
  );
}
