import { getTranslations } from "next-intl/server";

// The title lives here, in the shared (menu) layout, rather than in each
// page, so it never re-renders (and never re-animates) when navigating
// between the main menu and saves — only `children` (the card area) swaps.
// Top-anchored (not vertically centred) so the title's position doesn't
// shift when the card below it changes height between pages.
export default async function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("common");

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-6 pt-[18vh]">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {t("appName")}
        </h1>
        <p className="mt-3 text-muted-foreground">{t("tagline")}</p>
      </div>

      {children}
    </main>
  );
}
