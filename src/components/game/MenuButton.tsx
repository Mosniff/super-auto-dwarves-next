import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

export async function MenuButton() {
  const t = await getTranslations("common");

  return (
    <Button
      variant="ghost"
      asChild
      className="text-parchment-50 text-lg hover:bg-slate-200 hover:text-white"
    >
      <Link href="/">{t("menu")}</Link>
    </Button>
  );
}
