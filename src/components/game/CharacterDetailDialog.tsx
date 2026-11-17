"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { XIcon } from "lucide-react";
import type { Character } from "@/lib/game/character";
import type { CharacterAbility } from "@/lib/game/characterAbilities";
import { findCharacterAbilityForCharacter } from "@/lib/game/characterAbilityLookup";
import { abilityDescriptionMessages } from "./abilityDescriptionMessages";
import { ExpandedCharacterCard } from "./ExpandedCharacterCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CharacterDetailDialogProps {
  character: Character;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: ReactNode;
}

// Renders the ability's name, summary, and all five labelled level texts
// into the expanded card's ability box. The ability is looked up once, by
// the caller (CharacterDetailDialog), and passed down — this component
// never looks anything up itself.
function AbilityDescription({ ability }: { ability: CharacterAbility }) {
  const t = useTranslations("ability");
  const tCommon = useTranslations("common");

  const { nameKey, summaryKey, levelTexts } = abilityDescriptionMessages(ability);

  return (
    <div data-ability-description={ability.abilityId} className="flex flex-col gap-3 leading-snug">
      <p data-ability-name className="text-2xl font-bold leading-none">
        {t(nameKey)}
      </p>
      <DialogDescription asChild>
        <p data-ability-summary className="italic">
          {t(summaryKey)}
        </p>
      </DialogDescription>
      <ol className="flex flex-col gap-2">
        {levelTexts.map((levelText, levelIndex) => (
          <li
            key={levelText.key + levelIndex}
            data-ability-level={levelIndex + 1}
            className="flex gap-3"
          >
            <span data-ability-level-label className="shrink-0 font-bold">
              {tCommon("levelPill", { level: levelIndex + 1 })}
            </span>
            <span data-ability-level-text>{t(levelText.key, levelText.params)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function CharacterDetailDialog({
  character,
  open,
  onOpenChange,
  trigger,
}: CharacterDetailDialogProps) {
  const tCommon = useTranslations("common");
  const ability = findCharacterAbilityForCharacter(character);
  const hasAbility = ability !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger !== undefined && (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      )}
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-fit max-h-[calc(100dvh-2rem)] overflow-y-auto"
        // Radix otherwise wires aria-describedby to the DialogDescription
        // rendered inside AbilityDescription; with no ability there's no
        // description, so this is explicitly declared to suppress Radix's
        // "Missing Description" warning rather than left to point nowhere.
        {...(hasAbility ? {} : { "aria-describedby": undefined })}
      >
        <DialogTitle className="sr-only">{character.name}</DialogTitle>
        {/* A deliberately larger close button than shadcn's default; the
            human tunes its look. */}
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={tCommon("close")}
            className="absolute top-3 right-3 z-10"
          >
            <XIcon aria-hidden="true" className="size-6" />
          </Button>
        </DialogClose>
        <ExpandedCharacterCard
          character={character}
          abilityContent={ability !== undefined && <AbilityDescription ability={ability} />}
        />
      </DialogContent>
    </Dialog>
  );
}
