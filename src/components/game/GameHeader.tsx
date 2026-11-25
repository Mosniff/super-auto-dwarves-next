import { getTranslations } from "next-intl/server";
import { GameStatus } from "@/components/game/GameStatus";
import { HeaderDivider } from "@/components/game/HeaderDivider";
import { LocaleSwitcher } from "@/components/game/LocaleSwitcher";
import { MenuButton } from "@/components/game/MenuButton";
import { PhaseAdvanceButton } from "@/components/game/PhaseAdvanceButton";
import { HowToPlayDialog } from "@/components/menu/HowToPlayDialog";
import type { GamePhase } from "@/lib/game/types";

interface GameHeaderProps {
  day: number;
  gamePhase: GamePhase;
  advanceGameAction: (formData: FormData) => Promise<void>;
  // See PhaseAdvanceButton (Phase 13).
  isRunLost?: boolean;
}

export async function GameHeader({
  day,
  gamePhase,
  advanceGameAction,
  isRunLost = false,
}: GameHeaderProps) {
  const t = await getTranslations("common");

  return (
    <header className="w-full">
      {/* ── Utility strip ─────────────────────────────── */}
      {/* Three columns (Phase 16): the two outer ones share the leftover
          width equally, so the day sits at the header's true centre
          whatever the two sides hold. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-iron-900/40 bg-slate-300 h-(--game-header-height) px-4">
        <div className="flex items-center gap-4 justify-self-start">
          <span className="text-xl font-semibold tracking-wide text-parchment-50">
            {t("appName")}
          </span>
          <HeaderDivider />
          <MenuButton />
          <HowToPlayDialog triggerPlacement="header" />
          <LocaleSwitcher />
        </div>
        <GameStatus day={day} gamePhase={gamePhase} />
        <div className="flex items-center gap-4 justify-self-end">
          <PhaseAdvanceButton
            gamePhase={gamePhase}
            advanceGameAction={advanceGameAction}
            isRunLost={isRunLost}
          />
        </div>
      </div>
    </header>
  );
}
