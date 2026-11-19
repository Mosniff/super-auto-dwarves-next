"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { PendingSubmitButton } from "@/components/game/PendingSubmitButton";

interface GameOverScreenProps {
  day: number;
  depth: number;
  endRunAction: () => Promise<void>;
}

// The standalone screen after a lost battle (Phase 13): display-only, with
// "Return to menu" as the end-run intent — the server re-resolves the
// stored battle, deletes the save only if it was lost, and redirects to
// /saves. It slides in like the shell's content (see GameScreenShell).
export function GameOverScreen({ day, depth, endRunAction }: GameOverScreenProps) {
  const t = useTranslations("common");
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.main
      data-game-over-screen
      className="flex flex-1 flex-col items-center justify-center gap-6"
      initial={prefersReducedMotion ? false : { x: "100%" }}
      animate={{ x: "0%" }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      <h1 className="text-4xl font-semibold tracking-wide text-parchment-50">
        {t("gameOverTitle")}
      </h1>
      <p className="text-lg text-parchment-50">
        {t("gameOverSummary", { day, depth })}
      </p>
      <form data-end-run action={endRunAction}>
        <PendingSubmitButton size="lg">{t("returnToMenu")}</PendingSubmitButton>
      </form>
    </motion.main>
  );
}
