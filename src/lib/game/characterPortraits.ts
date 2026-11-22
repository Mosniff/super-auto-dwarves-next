import type { Character } from "./character";

// Which template has which portrait (Phase 12): template id → a file name in
// public/character_portraits. Looked up by template id, never by name
// (characters can be renamed; template ids never are). A template with no
// entry shows the "?" fallback. Guard tests check every key is a real
// template id and every file exists. To give a dwarf art, add or edit one
// line here.
export const CHARACTER_PORTRAIT_FILE_NAMES: Readonly<Record<string, string>> = {
  // dwarves
  borin: "borin.jpg",
  ogden: "ogden.jpg",
  norbin: "norbin.jpg",
  // kobolds
  "kobold-runt": "kobold_runt.jpg",
  "kobold-thief": "kobold_thief.jpg",
  // "kobold-priest": "kobold_priest.jpg",
};

export function characterPortraitSrc(
  character: Pick<Character, "characterTemplateId">,
): string | null {
  if (
    !Object.hasOwn(CHARACTER_PORTRAIT_FILE_NAMES, character.characterTemplateId)
  ) {
    return null;
  }
  return `/character_portraits/${CHARACTER_PORTRAIT_FILE_NAMES[character.characterTemplateId]}`;
}
