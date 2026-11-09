import type { Character } from "@/lib/battle/types";
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
    characterClassIds: [...characterTemplate.characterClassIds],
    attack: characterTemplate.attack,
    // hp starts at maxHp — a freshly spawned character is at full health.
    hp: characterTemplate.maxHp,
    maxHp: characterTemplate.maxHp,
  };
}
