// The translated page shown when notFound() is called inside a locale,
// including unknown paths (see [...rest]/page.tsx).
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/menu/StatusCard";
import { Link } from "@/i18n/navigation";

export default function LocaleNotFoundPage() {
  const t = useTranslations("common");

  return (
    <StatusCard
      title={t("notFoundPageTitle")}
      description={t("notFoundPageDescription")}
      actions={
        <Button size="lg" variant="outline" className="w-full" asChild>
          <Link href="/">{t("statusPageBackToMenu")}</Link>
        </Button>
      }
    />
  );
}
