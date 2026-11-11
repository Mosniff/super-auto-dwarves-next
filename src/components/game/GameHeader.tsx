import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/game/LocaleSwitcher";
import { MenuButton } from "@/components/game/MenuButton";

export async function GameHeader() {
  const t = await getTranslations("common");

  return (
    <header className="w-full">
      {/* ── Utility strip ─────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-iron-900/40 bg-slate-300 px-4 py-4">
        <span className="text-xl font-semibold tracking-wide text-parchment-50">
          {t("appName")}
        </span>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <MenuButton />
        </div>
      </div>
    </header>
  );
}
