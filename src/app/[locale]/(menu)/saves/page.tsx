import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MenuCardTransition } from "@/components/menu/MenuCardTransition";
import { SaveSlab } from "@/components/saves/SaveSlab";
import { readCurrentUserId } from "@/lib/supabase/readCurrentUserId";
import { prismaGameRepository } from "@/lib/persistence/prismaGameRepository";
import { loadSavedGameForUser } from "@/lib/persistence/loadSavedGameForUser";
import { createGameAction, deleteGameAction } from "../../gameActions";

export default async function SavesPage() {
  const t = await getTranslations("common");

  // Never signs anyone in — a missing session just sends the player home.
  const userId = await readCurrentUserId();

  if (userId === null) {
    const locale = await getLocale();
    redirect({ href: "/", locale });
    return;
  }

  const savedGame = await loadSavedGameForUser(userId, prismaGameRepository);
  const savedGameSummary = savedGame
    ? {
        createdAt: savedGame.createdAt,
        day: savedGame.gameState.day,
        phase: savedGame.gameState.phase,
      }
    : null;

  return (
    <MenuCardTransition enterFrom="right">
      <Card className="w-full">
        <CardContent className="flex flex-col gap-3">
          <SaveSlab
            savedGameSummary={savedGameSummary}
            createGameAction={createGameAction}
            deleteGameAction={deleteGameAction}
          />

          <Button asChild variant="ghost" className="w-full">
            <Link href="/">{t("back")}</Link>
          </Button>
        </CardContent>
      </Card>
    </MenuCardTransition>
  );
}
