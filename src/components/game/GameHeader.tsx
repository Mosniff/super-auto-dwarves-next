import { getTranslations } from "next-intl/server";
import { GameStatus } from "@/components/game/GameStatus";
import { HeaderDivider } from "@/components/game/HeaderDivider";
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

// Gems aren't implemented yet; the counter's place in the UI is pinned.
// Replace with the real count from the save when the mechanic exists.
const PLACEHOLDER_GEM_COUNT = 0;

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
      <div className="flex items-center justify-between border-b border-iron-900/40 bg-slate-300 px-4 py-4">
        <div className="flex items-center gap-4">
          <span className="text-xl font-semibold tracking-wide text-parchment-50">
            {t("appName")}
          </span>
          <HeaderDivider />
          <MenuButton />
          <LocaleSwitcher />
        </div>
        <div className="flex items-center gap-4">
          <GameStatus day={day} gold={gold} gems={PLACEHOLDER_GEM_COUNT} />
          <PhaseAdvanceButton
            gamePhase={gamePhase}
            advanceGameAction={advanceGameAction}
          />
        </div>
      </div>
    </header>
  );
}
