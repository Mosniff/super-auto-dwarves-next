"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// A placeholder until the new-player guide is written (a later phase). The
// "Coming soon" line doubles as Radix's required dialog description.
export function HowToPlayDialog() {
  const t = useTranslations("common");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg" variant="outline">
          {t("howToPlay")}
        </Button>
      </DialogTrigger>
      <DialogContent closeButtonLabel={t("close")}>
        <DialogTitle>{t("howToPlay")}</DialogTitle>
        <DialogDescription>{t("howToPlayComingSoon")}</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
