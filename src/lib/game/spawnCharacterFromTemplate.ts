import type { Character } from "./character";
import type { CharacterTemplate } from "./characterTemplates";

export function spawnCharacterFromTemplate(
  characterTemplate: CharacterTemplate,
  newCharacterId: string,
): Character {
  return {
    id: newCharacterId,
    characterTemplateId: characterTemplate.characterTemplateId,
    name: characterTemplate.name,
    tier: characterTemplate.tier,
    characterFactionId: characterTemplate.characterFactionId,
    characterClassIds: [...characterTemplate.characterClassIds],
    attack: characterTemplate.attack,
    // hp starts at maxHp — a freshly spawned character is at full health.
    hp: characterTemplate.maxHp,
    maxHp: characterTemplate.maxHp,
    armour: characterTemplate.armour,
    // a fresh character has no experience
    experience: 0,
  };
}
