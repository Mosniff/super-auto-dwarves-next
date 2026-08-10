"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Locale = (typeof routing.locales)[number];

const LOCALE_DISPLAY_NAMES: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
};

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");

  const handleLocaleChange = (nextLocale: string) => {
    router.replace(pathname, { locale: nextLocale as Locale });
  };

  return (
    <Select value={currentLocale} onValueChange={handleLocaleChange}>
      <SelectTrigger
        size="sm"
        aria-label={t("language")}
        className="h-7 border-iron-900/40 bg-slate-200 text-sm text-slate-50 hover:bg-slate-100"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {routing.locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {LOCALE_DISPLAY_NAMES[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
