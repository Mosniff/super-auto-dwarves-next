import type { ReactNode } from "react";
import type { BattleCharacterSide } from "@/lib/battle/types";

// The rich-text tag vocabulary (Phase 14) for the battle log and the
// expanded card's ability box: character names and game-value numbers.
// Name tags are attackerName / targetName / characterName, wrapping
// {attacker} / {target} / {character}: next-intl's values and tags share
// one object, so a tag named after its value would replace the value.
// Each tag renders a [data-highlight] span (names also carry data-side);
// the colours live in globals.css → "Text highlights", and
// src/i18n/messages.test.ts guards the tags in the message files.
export const CHARACTER_NAME_TAG_NAMES = ["attacker", "target", "character"] as const;
export type CharacterNameTagName = (typeof CHARACTER_NAME_TAG_NAMES)[number];
export type CharacterNameSides = Partial<Record<CharacterNameTagName, BattleCharacterSide>>;

export function textHighlightTags(characterNameSides: CharacterNameSides = {}) {
  const characterNameTag = (tagName: CharacterNameTagName) =>
    function renderCharacterName(chunks: ReactNode) {
      return (
        <span data-highlight="character" data-side={characterNameSides[tagName] ?? "unknown"}>
          {chunks}
        </span>
      );
    };
  return {
    attackerName: characterNameTag("attacker"),
    targetName: characterNameTag("target"),
    characterName: characterNameTag("character"),
    number: (chunks: ReactNode) => <span data-highlight="number">{chunks}</span>,
  };
}
