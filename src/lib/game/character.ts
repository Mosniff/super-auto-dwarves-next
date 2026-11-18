import type { CharacterFactionId } from "./characterFactions";
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
  // copied from the template, like the classes (Phase 13)
  characterFactionId: CharacterFactionId;
  characterClassIds: CharacterClassId[];
  attack: number;
  hp: number;
  // full-health ceiling; current hp never exceeds this
  maxHp: number;
  // base armour; while above 0, damage hits armour instead of hp (Phase
  // 12). In battle this is the current value — buffs change the battle
  // copy only, which is safe because battles write nothing back. If
  // battles gain consequences, revisit (base vs current, like hp/maxHp).
  armour: number;
  // 0 to MAX_CHARACTER_EXPERIENCE. The level is always derived from this
  // (levelFromExperience) and never stored.
  experience: number;
}
