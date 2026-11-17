import type { Character } from "./character";
import type { CharacterAbility } from "./characterAbilities";
import type { CharacterLevel } from "./characterExperience";

export type ExperienceGainAbility = Extract<
  CharacterAbility,
  { trigger: "onExperienceGain" }
>;

// Pure effects of onExperienceGain abilities: fired once per XP point
// gained, at the level the character had before that point (Phase 12).
export function applyExperienceGainAbility(
  ability: ExperienceGainAbility,
  character: Character,
  levelBeforePoint: CharacterLevel,
): Character {
  switch (ability.abilityId) {
    case "growing-lad": {
      const extraHp =
        ability.extraHpPerExperiencePointByLevel[levelBeforePoint - 1];
      return {
        ...character,
        hp: character.hp + extraHp,
        maxHp: character.maxHp + extraHp,
      };
    }
    default: {
      // Asserted on the discriminant, not the object: TypeScript only
      // narrows an object by its discriminant when the type is a union,
      // and ExperienceGainAbility is currently a single ability. The
      // switch expression itself still narrows to never here, so adding
      // a second onExperienceGain ability without a case remains a
      // compile error.
      const unreachableAbilityId: never = ability.abilityId;
      throw new Error(
        `No onExperienceGain effect for ability: ${String(unreachableAbilityId)}`,
      );
    }
  }
}
