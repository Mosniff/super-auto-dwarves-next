import type { Character } from "@/lib/game/character";
import type { BattleCharacterLabel, BattleState } from "./types";

// Scans the initial rosters only. When character-introducing events (e.g.
// summons) are added later, this is where newly introduced characters would
// also need to be scanned to keep the map complete.
// displayCharacterName is injected by the client, which translates names
// (Phase 13); the default (the stored name) keeps src/lib free of words.
// Each label also records the character's side, from the roster it starts
// in, so the battle log can colour names by side (Phase 14).
export function buildCharacterLabelMap(
  initialState: BattleState,
  displayCharacterName: (character: Character) => string = (character) =>
    character.name,
): Map<string, BattleCharacterLabel> {
  const characterLabelMap = new Map<string, BattleCharacterLabel>();

  const playerCharacters = [
    ...initialState.player.activeCharacters,
    ...initialState.player.downedCharacters,
  ];
  const enemyCharacters = [
    ...initialState.enemy.activeCharacters,
    ...initialState.enemy.downedCharacters,
  ];

  for (const character of playerCharacters) {
    characterLabelMap.set(character.id, {
      name: displayCharacterName(character),
      side: "player",
    });
  }

  for (const character of enemyCharacters) {
    characterLabelMap.set(character.id, {
      name: displayCharacterName(character),
      side: "enemy",
    });
  }

  return characterLabelMap;
}
