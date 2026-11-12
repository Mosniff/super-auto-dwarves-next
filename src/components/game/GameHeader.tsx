import { getTranslations } from "next-intl/server";
import { GameStatus } from "@/components/game/GameStatus";
import { LocaleSwitcher } from "@/components/game/LocaleSwitcher";
import { MenuButton } from "@/components/game/MenuButton";

interface GameHeaderProps {
  day: number;
  gold: number;
}

export async function GameHeader({ day, gold }: GameHeaderProps) {
  const t = await getTranslations("common");

  return (
    <header className="w-full">
      {/* ── Utility strip ─────────────────────────────── */}
      <div className="grid grid-cols-3 items-center border-b border-iron-900/40 bg-slate-300 px-4 py-4">
        <span className="text-xl font-semibold tracking-wide text-parchment-50">
          {t("appName")}
        </span>
        <div className="justify-self-center">
          <GameStatus day={day} gold={gold} />
        </div>
        <div className="flex items-center justify-self-end gap-2">
          <LocaleSwitcher />
          <MenuButton />
        </div>
      </div>
    </header>
  );
}
