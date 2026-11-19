import { useTranslations } from "next-intl";
import type { Character } from "@/lib/game/character";

export type CharacterDisplayNameSource = Pick<
  Character,
  "characterTemplateId" | "name"
>;

// Character names are display text, translated by template id through the
// characterName namespace, which every real template must have (the
// messages parity test). The name stored on a character is only a
// fallback, for test fixtures whose templates have no entry (Phase 13).
export function useCharacterDisplayName(): (
  character: CharacterDisplayNameSource,
) => string {
  const translateCharacterName = useTranslations("characterName");

  return (character) =>
    translateCharacterName.has(character.characterTemplateId)
      ? translateCharacterName(character.characterTemplateId)
      : character.name;
}
