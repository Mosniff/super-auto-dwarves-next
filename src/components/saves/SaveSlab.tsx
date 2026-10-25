"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { GamePhase } from "@/lib/game/types";

interface SavedGameSummary {
  createdAt: Date;
  day: number;
  phase: GamePhase;
}

interface SaveSlabProps {
  savedGameSummary: SavedGameSummary | null;
  createGameAction: () => Promise<void>;
  deleteGameAction: () => Promise<void>;
}

export function SaveSlab({
  savedGameSummary,
  createGameAction,
  deleteGameAction,
}: SaveSlabProps) {
  const t = useTranslations("common");
  const format = useFormatter();

  return (
    <div className="flex flex-col gap-3">
      {savedGameSummary === null ? (
        <>
          <p className="text-center text-muted-foreground">
            {t("noSavedGame")}
          </p>
          <form action={createGameAction} className="w-full">
            <Button type="submit" className="w-full" size="lg">
              {t("newGame")}
            </Button>
          </form>
        </>
      ) : (
        <>
          <p className="text-center text-muted-foreground">
            {t("startedOn", {
              // Explicit UTC: the server and the browser's local time
              // zones differ, so formatting in each would both mismatch
              // on hydration and risk showing the wrong calendar date
              // near midnight.
              date: format.dateTime(savedGameSummary.createdAt, {
                dateStyle: "medium",
                timeZone: "UTC",
              }),
            })}
          </p>
          <p className="text-center text-muted-foreground">
            {t("dayLabel", { day: savedGameSummary.day })} —{" "}
            {savedGameSummary.phase === "campPhase"
              ? t("phaseCamp")
              : t("phaseBattle")}
          </p>

          <Button asChild className="w-full" size="lg">
            <Link href="/play">{t("resume")}</Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full" size="lg" variant="outline">
                {t("delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteSaveTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteSaveDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <form action={deleteGameAction}>
                  <AlertDialogAction type="submit">
                    {t("delete")}
                  </AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
