import type { Character } from "@/lib/game/character";
import type { CharacterTemplate } from "@/lib/game/characterTemplates";

// Shared test-data builders. The defaults are deliberately boring and must
// NEVER change: a test passes explicitly every value it depends on, so
// changing a default could silently change what other tests mean. When a
// new field is added to Character or CharacterTemplate, add its default
// here — this is the one place that should need it. abilityId defaults to
// a real ability id only because templates require one; tests that depend
// on a template's ability pass it explicitly.

export function buildTestCharacter(overrides: Partial<Character> = {}): Character {
  const maxHp = overrides.maxHp ?? 7;
  return {
    id: "fixture-character",
    characterTemplateId: "fixture-dwarf",
    name: "Fixture Dwarf",
    tier: 1,
    attack: 4,
    maxHp,
    armour: 0,
    experience: 0,
    ...overrides,
    // a fresh character is at full health unless the test says otherwise
    hp: overrides.hp ?? maxHp,
    characterClassIds: [...(overrides.characterClassIds ?? ["warrior"])],
  };
}

export function buildTestCharacterTemplate(
  overrides: Partial<CharacterTemplate> = {},
): CharacterTemplate {
  return {
    characterTemplateId: "fixture-dwarf",
    name: "Fixture Dwarf",
    tier: 1,
    attack: 4,
    maxHp: 7,
    armour: 0,
    abilityId: "growing-lad",
    ...overrides,
    characterClassIds: [...(overrides.characterClassIds ?? ["warrior"])],
  };
}
