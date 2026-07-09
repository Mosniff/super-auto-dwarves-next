import type { BattleState } from "./types";

// Scans the initial rosters only. When character-introducing events (e.g.
// summons) are added later, this is where newly introduced characters would
// also need to be scanned to keep the map complete.
export function buildNameMap(initialState: BattleState): Map<string, string> {
  const nameMap = new Map<string, string>();

  const allCharacters = [
    ...initialState.player.activeCharacters,
    ...initialState.player.downedCharacters,
    ...initialState.enemy.activeCharacters,
    ...initialState.enemy.downedCharacters,
  ];

  for (const character of allCharacters) {
    nameMap.set(character.id, character.name);
  }

  return nameMap;
}
