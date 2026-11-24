"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// The new-player guide (Phase 15). Its text lives in the howToPlay message
// namespace; this list gives the order and the heading levels. The intro
// doubles as Radix's required dialog description.
const HOW_TO_PLAY_SECTIONS = [
  {
    headingKey: "campHeading",
    subsections: [
      {
        headingKey: "recruitingHeading",
        paragraphKeys: ["recruitingGold", "recruitingCost", "recruitingInfo"],
      },
      { headingKey: "promotingHeading", paragraphKeys: ["promotingBody"] },
      {
        headingKey: "mergingSellingHeading",
        paragraphKeys: ["mergingSellingToggle"],
        listItemKeys: ["mergeItem", "sellItem"],
      },
      { headingKey: "lineUpHeading", paragraphKeys: ["lineUpBody"] },
    ],
  },
  {
    headingKey: "battleHeading",
    subsections: [
      {
        headingKey: "fightHeading",
        paragraphKeys: ["fightBody", "fightEnding"],
      },
      { headingKey: "watchingHeading", paragraphKeys: ["watchingBody"] },
    ],
  },
] as const satisfies readonly {
  headingKey: string;
  subsections: readonly {
    headingKey: string;
    paragraphKeys: readonly string[];
    listItemKeys?: readonly string[];
  }[];
}[];

// The guide's only tag: a bold lead-in ("Merge:", "Sell:").
const howToPlayTags = {
  strong: (chunks: ReactNode) => (
    <strong className="font-semibold text-foreground">{chunks}</strong>
  ),
};

export function HowToPlayDialog() {
  const translateCommon = useTranslations("common");
  const translateHowToPlay = useTranslations("howToPlay");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg" variant="outline">
          {translateCommon("howToPlay")}
        </Button>
      </DialogTrigger>
      <DialogContent
        closeButtonLabel={translateCommon("close")}
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg md:max-w-2xl xl:max-w-3xl"
      >
        <DialogTitle>{translateCommon("howToPlay")}</DialogTitle>
        <DialogDescription>{translateHowToPlay("intro")}</DialogDescription>
        {HOW_TO_PLAY_SECTIONS.map((section) => (
          <section key={section.headingKey} className="flex flex-col gap-3">
            <h3 className="text-base font-semibold">
              {translateHowToPlay(section.headingKey)}
            </h3>
            {section.subsections.map((subsection) => (
              <div
                key={subsection.headingKey}
                className="flex flex-col gap-1.5"
              >
                <h4 className="font-semibold">
                  {translateHowToPlay(subsection.headingKey)}
                </h4>
                {subsection.paragraphKeys.map((paragraphKey) => (
                  <p key={paragraphKey} className="text-muted-foreground">
                    {translateHowToPlay(paragraphKey)}
                  </p>
                ))}
                {"listItemKeys" in subsection ? (
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    {subsection.listItemKeys.map((listItemKey) => (
                      <li key={listItemKey}>
                        {translateHowToPlay.rich(listItemKey, howToPlayTags)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </section>
        ))}
      </DialogContent>
    </Dialog>
  );
}
