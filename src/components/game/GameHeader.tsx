import { getTranslations } from "next-intl/server";
import { GameStatus } from "@/components/game/GameStatus";
import { LocaleSwitcher } from "@/components/game/LocaleSwitcher";
import { MenuButton } from "@/components/game/MenuButton";
import { PhaseAdvanceButton } from "@/components/game/PhaseAdvanceButton";
import type { GamePhase } from "@/lib/game/types";

interface GameHeaderProps {
  day: number;
  gold: number;
  gamePhase: GamePhase;
  advanceGameAction: (formData: FormData) => Promise<void>;
}

export async function GameHeader({
  day,
  gold,
  gamePhase,
  advanceGameAction,
}: GameHeaderProps) {
  const t = await getTranslations("common");

  return (
    <header className="w-full">
      {/* ── Utility strip ─────────────────────────────── */}
      <div className="grid grid-cols-3 items-center border-b border-iron-900/40 bg-slate-300 px-4 py-4">
        <span className="text-xl font-semibold tracking-wide text-parchment-50">
          {t("appName")}
        </span>
        <div className="flex items-center justify-self-center gap-4">
          <GameStatus day={day} gold={gold} />
          <PhaseAdvanceButton
            gamePhase={gamePhase}
            advanceGameAction={advanceGameAction}
          />
        </div>
        <div className="flex items-center justify-self-end gap-2">
          <LocaleSwitcher />
          <MenuButton />
        </div>
      </div>
    </header>
  );
}
