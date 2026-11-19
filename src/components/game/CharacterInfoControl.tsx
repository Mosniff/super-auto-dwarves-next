"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Character } from "@/lib/game/character";
import { CharacterDetailDialog } from "./CharacterDetailDialog";
import { useCharacterDisplayName } from "./characterDisplayName";

interface CharacterInfoControlProps {
  character: Character;
  // Lets a screen react to the player opening the "i" (battle pauses
  // autoplay).
  onOpen?: () => void;
}

// Mirrors the merge/swap badges (-top-2 -left-2, size-7, z-10) on the
// opposite corner. Must always be rendered as a sibling of a slot button,
// never inside one — a button inside a button is invalid HTML, and
// CharacterCard stays non-interactive. Its visibility is CSS (see
// globals.css's info-control reveal rules), not React state.
export function CharacterInfoControl({
  character,
  onOpen,
}: CharacterInfoControlProps) {
  const t = useTranslations("common");
  const displayCharacterName = useCharacterDisplayName();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // The "i" is the dialog's DialogTrigger (passed below), so Radix
  // restores focus to it on close. Without a trigger, a controlled dialog
  // dropped focus to <body> (found by investigation).
  return (
    <CharacterDetailDialog
      character={character}
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (open) {
          onOpen?.();
        }
      }}
      trigger={
        <button
          type="button"
          data-character-info-control
          aria-label={t("characterInfoLabel", { name: displayCharacterName(character) })}
          // Its own hover and focus state shows the player is on the "i"
          // itself, not just the card; the card stays revealed meanwhile
          // (globals.css).
          className="absolute -top-2 -right-2 z-10 flex size-7 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-white shadow ring-2 ring-white transition-transform hover:scale-110 hover:bg-slate-900 focus-visible:outline-none hover:ring-transparent focus-visible:ring-transparent motion-reduce:transition-none motion-reduce:hover:scale-100 focus-visible:bg-slate-900 focus-visible:scale-110 motion-reduce:focus-visible:scale-100"
        >
          <span
            aria-hidden="true"
            className="font-serif text-base font-bold italic leading-none"
          >
            i
          </span>
        </button>
      }
    />
  );
}
