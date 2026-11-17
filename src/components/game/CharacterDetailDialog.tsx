"use client";

import { useTranslations } from "next-intl";
import type { Character } from "@/lib/game/character";
import type { CharacterAbility } from "@/lib/game/characterAbilities";
import { findCharacterAbilityForCharacter } from "@/lib/game/characterAbilityLookup";
import { abilityDescriptionMessages } from "./abilityDescriptionMessages";
import { CharacterCard } from "./CharacterCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface CharacterDetailDialogProps {
  character: Character;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Renders the ability's name, summary, and all five labelled level texts
// into the card's text box. The ability is looked up once, by the caller
// (CharacterDetailDialog), and passed down — this component never looks
// anything up itself.
function AbilityDescription({ ability }: { ability: CharacterAbility }) {
  const t = useTranslations("ability");
  const tCommon = useTranslations("common");

  const { nameKey, summaryKey, levelTexts } = abilityDescriptionMessages(ability);

  return (
    <div
      data-ability-description={ability.abilityId}
      className="flex flex-col gap-card-ability-gap text-card-ability-body leading-snug"
    >
      <p data-ability-name className="text-card-ability-name font-bold leading-none">
        {t(nameKey)}
      </p>
      <DialogDescription asChild>
        <p data-ability-summary className="italic">
          {t(summaryKey)}
        </p>
      </DialogDescription>
      <ol className="flex flex-col gap-card-ability-gap">
        {levelTexts.map((levelText, levelIndex) => (
          <li
            key={levelText.key + levelIndex}
            data-ability-level={levelIndex + 1}
            className="flex gap-card-label-gap"
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
}: CharacterDetailDialogProps) {
  const tCommon = useTranslations("common");
  const ability = findCharacterAbilityForCharacter(character);
  const hasAbility = ability !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeButtonLabel={tCommon("close")}
        className="sm:max-w-fit"
        // Radix otherwise wires aria-describedby to the DialogDescription
        // rendered inside AbilityDescription; with no ability there's no
        // description, so this is explicitly declared to suppress Radix's
        // "Missing Description" warning rather than left to point nowhere.
        {...(hasAbility ? {} : { "aria-describedby": undefined })}
      >
        <DialogTitle className="sr-only">{character.name}</DialogTitle>
        <div className="h-(--expanded-card-height) w-(--expanded-card-width)">
          <CharacterCard
            character={character}
            showLevel
            showTextBox
            textBoxContent={
              ability !== undefined && <AbilityDescription ability={ability} />
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
