"use client";

// The error boundary for everything inside the locale layout: a translated
// card with Try again (Next's retry, which re-fetches and re-renders the
// segment — our errors are mostly server-side) and a way back to the menu.
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/menu/StatusCard";
import { Link } from "@/i18n/navigation";

export default function LocaleErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusCard
      title={t("errorPageTitle")}
      description={t("errorPageDescription")}
      actions={
        <>
          <Button size="lg" className="w-full" onClick={() => retry()}>
            {t("errorPageTryAgain")}
          </Button>
          <Button size="lg" variant="outline" className="w-full" asChild>
            <Link href="/">{t("statusPageBackToMenu")}</Link>
          </Button>
        </>
      }
    />
  );
}
