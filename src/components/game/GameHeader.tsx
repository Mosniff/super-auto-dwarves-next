import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/game/LocaleSwitcher";

export async function GameHeader() {
  const t = await getTranslations("common");

  return (
    <header className="w-full">
      {/* ── Utility strip ─────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-iron-900/40 bg-slate-300 px-4 py-1.5">
        <span className="text-sm font-semibold tracking-wide text-slate-50">
          {t("appName")}
        </span>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-slate-50 hover:bg-slate-200 hover:text-white"
          >
            <Link href="/">{t("menu")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
