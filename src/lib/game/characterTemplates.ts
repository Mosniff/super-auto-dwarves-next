import type { CharacterClassId } from "./characterClasses";
import type { CharacterTier } from "./characterTiers";
import type { CharacterAbilityId } from "./characterAbilities";

export interface CharacterTemplate {
  readonly characterTemplateId: string;
  readonly name: string;
  readonly tier: CharacterTier;
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
    borin: {
      characterTemplateId: "borin",
      name: "Borin",
      tier: 1,
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
      characterClassIds: ["warrior"],
      attack: 3,
      maxHp: 8,
      armour: 0,
      abilityId: "tighten-those-straps-son",
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
