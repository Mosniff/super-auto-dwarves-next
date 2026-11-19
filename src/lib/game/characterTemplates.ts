import type { CharacterClassId } from "./characterClasses";
import {
  PLAYER_FACTION_ID,
  type CharacterFactionId,
} from "./characterFactions";
import type { CharacterTier } from "./characterTiers";
import type { CharacterAbilityId } from "./characterAbilities";

export interface CharacterTemplate {
  readonly characterTemplateId: string;
  readonly name: string;
  readonly tier: CharacterTier;
  readonly characterFactionId: CharacterFactionId;
  readonly characterClassIds: readonly CharacterClassId[];
  readonly attack: number;
  readonly maxHp: number;
  readonly armour: number;
  readonly abilityId: CharacterAbilityId;
}

// Ids are lowercase kebab-case. An id used in a save must never be renamed
// or deleted, only retired from the shop. The human designs the real
// templates by hand.
export const CHARACTER_TEMPLATES: Readonly<Record<string, CharacterTemplate>> =
  {
    // Tier 1
    borin: {
      characterTemplateId: "borin",
      name: "Borin",
      tier: 1,
      characterFactionId: "dwarf",
      characterClassIds: ["warrior"],
      attack: 4,
      maxHp: 7,
      armour: 0,
      abilityId: "growing-lad",
    },
    ogden: {
      characterTemplateId: "ogden",
      name: "Ogden",
      tier: 1,
      characterFactionId: "dwarf",
      characterClassIds: ["warrior"],
      attack: 3,
      maxHp: 8,
      armour: 0,
      abilityId: "tighten-those-straps-son",
    },
    norbin: {
      characterTemplateId: "norbin",
      name: "Norbin",
      tier: 1,
      characterFactionId: "dwarf",
      characterClassIds: ["merchant"],
      attack: 1,
      maxHp: 3,
      armour: 0,
      abilityId: "penny-pincher",
    },
    // Kobolds (Phase 13): enemy-only, never offered in the shop.
    "kobold-runt": {
      characterTemplateId: "kobold-runt",
      name: "Kobold Runt",
      tier: 1,
      characterFactionId: "kobold",
      characterClassIds: ["warrior"],
      attack: 1,
      maxHp: 3,
      armour: 0,
      abilityId: "yip",
    },
    "kobold-thief": {
      characterTemplateId: "kobold-thief",
      name: "Kobold Thief",
      tier: 1,
      characterFactionId: "kobold",
      characterClassIds: ["warrior"],
      attack: 2,
      maxHp: 3,
      armour: 0,
      abilityId: "yip-strike",
    },
  };

export function findCharacterTemplate(
  characterTemplateId: string,
): CharacterTemplate | undefined {
  if (!Object.hasOwn(CHARACTER_TEMPLATES, characterTemplateId)) {
    return undefined;
  }
  return CHARACTER_TEMPLATES[characterTemplateId];
}

export function listCharacterTemplates(): CharacterTemplate[] {
  return Object.values(CHARACTER_TEMPLATES);
}

// The templates the player's shop may offer: the player's faction only
// (Phase 13). Enemy templates (kobolds) exist for enemy rosters and must
// never be rolled into the shop.
export function listPlayerShopCharacterTemplates(): CharacterTemplate[] {
  return listCharacterTemplates().filter(
    (characterTemplate) =>
      characterTemplate.characterFactionId === PLAYER_FACTION_ID,
  );
}
