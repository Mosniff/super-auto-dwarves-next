import type { Character } from "@/lib/battle/types";
import type { CharacterClassId } from "./characterClasses";
import type { CharacterTier } from "./characterTiers";
import type { CharacterTemplate } from "./characterTemplates";

export interface OwnedCharacter extends Character {
  characterTemplateId: string;
  tier: CharacterTier;
  characterClassIds: CharacterClassId[];
}

export function spawnCharacterFromTemplate(
  characterTemplate: CharacterTemplate,
  newCharacterId: string,
): OwnedCharacter {
  return {
    id: newCharacterId,
    characterTemplateId: characterTemplate.characterTemplateId,
    name: characterTemplate.name,
    tier: characterTemplate.tier,
    characterClassIds: [...characterTemplate.characterClassIds],
    attack: characterTemplate.attack,
    // hp starts at maxHp — a freshly spawned character is at full health.
    hp: characterTemplate.maxHp,
    maxHp: characterTemplate.maxHp,
  };
}
