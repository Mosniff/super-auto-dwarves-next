import type { CharacterTier } from "./characterTiers";
import type { CharacterClassId } from "./characterClasses";

// One character type for camp, shop and battle; every character comes from
// a template and stores everything on itself. The battle engine fights with
// attack and hp only — tier and classes have no battle effect yet.
export interface Character {
  id: string;
  characterTemplateId: string;
  name: string;
  tier: CharacterTier;
  characterClassIds: CharacterClassId[];
  attack: number;
  hp: number;
  // full-health ceiling; current hp never exceeds this
  maxHp: number;
}
