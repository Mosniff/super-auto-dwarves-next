"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Character } from "@/lib/game/character";
import { CharacterDetailDialog } from "./CharacterDetailDialog";

interface CharacterInfoControlProps {
  character: Character;
}

// Mirrors the merge/swap badges (-top-2 -left-2, size-7, z-10) on the
// opposite corner. Must always be rendered as a sibling of a slot button,
// never inside one — a button inside a button is invalid HTML, and
// CharacterCard stays non-interactive. Its visibility is CSS (see
// globals.css's info-control reveal rules), not React state.
export function CharacterInfoControl({ character }: CharacterInfoControlProps) {
  const t = useTranslations("common");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        data-character-info-control
        aria-label={t("characterInfoLabel", { name: character.name })}
        onClick={() => setIsDialogOpen(true)}
        className="absolute -top-2 -right-2 z-10 flex size-7 items-center justify-center rounded-full bg-slate-700 text-white shadow ring-2 ring-white focus-visible:outline-none focus-visible:ring-ring"
      >
        <span
          aria-hidden="true"
          className="font-serif text-base font-bold italic leading-none"
        >
          i
        </span>
      </button>
      <CharacterDetailDialog
        character={character}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}
