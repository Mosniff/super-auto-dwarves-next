// Abilities are typed, read-only game data keyed by id, like templates
// (Phase 12). Every template names exactly one ability (abilityId); a
// character's ability is looked up through its characterTemplateId, so
// saves store nothing about abilities. Per-level values are arrays indexed
// by level - 1. Level texts take their numbers from this data (see
// abilityDescriptionMessages), so a description can't disagree with what
// the ability does. Ids are lowercase kebab-case and, like template ids,
// are never renamed or deleted once used.

export const CHARACTER_ABILITY_IDS = [
  "growing-lad",
  "tighten-those-straps-son",
  "penny-pincher",
  "yip",
  "yip-strike",
] as const;

export type CharacterAbilityId = (typeof CHARACTER_ABILITY_IDS)[number];

export type CharacterAbilityTrigger =
  | "onExperienceGain"
  | "onBattleStartBuffs"
  | "onCampStart"
  // Phase 13: declared with the kobolds; no battle code fires them yet
  // (step 7 adds their behaviour).
  | "onTurnStart"
  | "onBattleStartDamage";

// Index 0 is level 1 ... index 4 is level 5.
export type PerLevel<Value> = readonly [Value, Value, Value, Value, Value];

// "Ahead" counts toward the front of the battle's squeezed line.
export type AbilityTargeting =
  | { readonly kind: "alliesAhead"; readonly count: number }
  | { readonly kind: "wholeParty" };

export type CharacterAbility =
  | {
      readonly abilityId: "growing-lad";
      readonly trigger: "onExperienceGain";
      // extra max hp and current hp per XP point gained, by the level the
      // dwarf had before that point
      readonly extraHpPerExperiencePointByLevel: PerLevel<number>;
    }
  | {
      readonly abilityId: "tighten-those-straps-son";
      readonly trigger: "onBattleStartBuffs";
      readonly armourGrantedByLevel: PerLevel<number>;
      readonly targetingByLevel: PerLevel<AbilityTargeting>;
    }
  | {
      readonly abilityId: "penny-pincher";
      readonly trigger: "onCampStart";
      // gold added at the start of each camp, by level
      readonly goldByLevel: PerLevel<number>;
    }
  | {
      // the Kobold Runt's joke: a yip at the start of every turn, no effect
      readonly abilityId: "yip";
      readonly trigger: "onTurnStart";
    }
  | {
      // the Kobold Thief: hits of damage at random enemies at battle start
      readonly abilityId: "yip-strike";
      readonly trigger: "onBattleStartDamage";
      readonly hitCountByLevel: PerLevel<number>;
      readonly damagePerHitByLevel: PerLevel<number>;
    };

export const CHARACTER_ABILITIES: {
  readonly [AbilityId in CharacterAbilityId]: Extract<
    CharacterAbility,
    { abilityId: AbilityId }
  >;
} = {
  "growing-lad": {
    abilityId: "growing-lad",
    trigger: "onExperienceGain",
    extraHpPerExperiencePointByLevel: [1, 2, 3, 4, 5],
  },
  "tighten-those-straps-son": {
    abilityId: "tighten-those-straps-son",
    trigger: "onBattleStartBuffs",
    armourGrantedByLevel: [1, 1, 1, 1, 1],
    targetingByLevel: [
      { kind: "alliesAhead", count: 1 },
      { kind: "alliesAhead", count: 2 },
      { kind: "alliesAhead", count: 3 },
      { kind: "alliesAhead", count: 4 },
      { kind: "wholeParty" },
    ],
  },
  "penny-pincher": {
    abilityId: "penny-pincher",
    trigger: "onCampStart",
    goldByLevel: [1, 2, 3, 4, 5],
  },
  yip: {
    abilityId: "yip",
    trigger: "onTurnStart",
  },
  "yip-strike": {
    abilityId: "yip-strike",
    trigger: "onBattleStartDamage",
    hitCountByLevel: [1, 2, 3, 4, 5],
    damagePerHitByLevel: [1, 1, 1, 1, 1],
  },
};

export function findCharacterAbility(
  abilityId: CharacterAbilityId,
): CharacterAbility {
  return CHARACTER_ABILITIES[abilityId];
}
