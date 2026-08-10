import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const t = useTranslations("common");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {t("appName")}
        </h1>
        <p className="mt-3 text-muted-foreground">{t("tagline")}</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-3">
          <Button className="w-full" size="lg" asChild>
            <Link href="/play">{t("play")}</Link>
          </Button>
          <Button className="w-full" size="lg" variant="outline">
            {t("settings")}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
