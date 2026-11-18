// Faction ids live in code; their words live in the message files (the
// faction namespace), never here (Phase 13).
export const CHARACTER_FACTION_IDS = ["dwarf", "kobold"] as const;

export type CharacterFactionId = (typeof CHARACTER_FACTION_IDS)[number];

// The player's side is always dwarves.
export const PLAYER_FACTION_ID: CharacterFactionId = "dwarf";

export function isCharacterFactionId(
  candidateFactionId: unknown,
): candidateFactionId is CharacterFactionId {
  return (
    typeof candidateFactionId === "string" &&
    (CHARACTER_FACTION_IDS as readonly string[]).includes(candidateFactionId)
  );
}
