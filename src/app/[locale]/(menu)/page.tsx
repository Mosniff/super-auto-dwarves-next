import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MenuCardTransition } from "@/components/menu/MenuCardTransition";
import { startPlayingAction } from "../startPlayingAction";

export default function HomePage() {
  const t = useTranslations("common");

  return (
    <MenuCardTransition enterFrom="left">
      <Card className="w-full">
        <CardContent className="flex flex-col gap-3">
          <form action={startPlayingAction} className="w-full">
            <Button type="submit" className="w-full" size="lg">
              {t("play")}
            </Button>
          </form>
          <Button className="w-full" size="lg" variant="outline">
            {t("settings")}
          </Button>
        </CardContent>
      </Card>
    </MenuCardTransition>
  );
}
