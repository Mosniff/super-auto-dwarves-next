import type { Character } from "@/lib/game/character";
import type { BattleState } from "./types";

// Scans the initial rosters only. When character-introducing events (e.g.
// summons) are added later, this is where newly introduced characters would
// also need to be scanned to keep the map complete.
// displayCharacterName is injected by the client, which translates names
// (Phase 13); the default (the stored name) keeps src/lib free of words.
export function buildNameMap(
  initialState: BattleState,
  displayCharacterName: (character: Character) => string = (character) =>
    character.name,
): Map<string, string> {
  const nameMap = new Map<string, string>();

  const allCharacters = [
    ...initialState.player.activeCharacters,
    ...initialState.player.downedCharacters,
    ...initialState.enemy.activeCharacters,
    ...initialState.enemy.downedCharacters,
  ];

  for (const character of allCharacters) {
    nameMap.set(character.id, displayCharacterName(character));
  }

  return nameMap;
}
