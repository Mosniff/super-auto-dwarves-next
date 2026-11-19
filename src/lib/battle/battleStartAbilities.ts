import type { Character } from "@/lib/game/character";
import type {
  CharacterAbility,
  CharacterAbilityId,
} from "@/lib/game/characterAbilities";
import { findCharacterAbilityForCharacter } from "@/lib/game/characterAbilityLookup";
import { levelFromExperience } from "@/lib/game/characterExperience";
import type { ChooseRandomIndex } from "@/lib/game/chooseRandomIndex";

// Battle-start sub-phases, run in this order after the prepare beat and
// before turn 1 (Phase 12): buffs, then damage (Phase 13, Yip Strike).
// Summon sub-phases come later.
export const BATTLE_START_SUB_PHASES = [
  "onBattleStartBuffs",
  "onBattleStartDamage",
] as const;
export type BattleStartSubPhase = (typeof BATTLE_START_SUB_PHASES)[number];

// What an ability plans to do, chosen from the sub-phase's snapshot. The
// resolver turns each effect into outcome events against the CURRENT state,
// so effects stack. "damage" goes through resolveHit, so armour applies
// (Yip Strike, Phase 13).
export type PlannedAbilityEffect =
  | { effectKind: "statChange"; targetId: string; stat: "armour"; amount: number }
  | { effectKind: "damage"; targetId: string; amount: number };

export interface BattleStartAbilityPlan {
  abilityId: CharacterAbilityId;
  effects: PlannedAbilityEffect[];
}

export interface BattleStartPlanningContext {
  subPhase: BattleStartSubPhase;
  actor: Character;
  // the actor's position in its own side's active line (0 is the front)
  actorIndex: number;
  // snapshots of the actor's own side and the opposing side, front to back
  allies: readonly Character[];
  opponents: readonly Character[];
  // the battle's seeded random source (Phase 13): the same stored seed
  // gives the same choices on every re-resolve
  chooseRandomIndex: ChooseRandomIndex;
}

export type BattleStartAbilityPlanner = (
  context: BattleStartPlanningContext,
) => BattleStartAbilityPlan | null;

export function planBattleStartAbility(
  context: BattleStartPlanningContext,
): BattleStartAbilityPlan | null {
  const ability = findCharacterAbilityForCharacter(context.actor);

  // The trigger names and sub-phase names are deliberately the same
  // strings. Narrows ability to the abilities whose trigger is this
  // sub-phase (trigger is a discriminant correlated with abilityId), so
  // the switch below only ever sees battle-start abilities, which
  // TypeScript proves.
  if (ability === undefined || ability.trigger !== context.subPhase) {
    return null;
  }

  switch (ability.abilityId) {
    case "tighten-those-straps-son": {
      const level = levelFromExperience(context.actor.experience);
      const targeting = ability.targetingByLevel[level - 1];
      const armourGranted = ability.armourGrantedByLevel[level - 1];

      const targets =
        targeting.kind === "alliesAhead"
          ? context.allies.slice(
              Math.max(0, context.actorIndex - targeting.count),
              context.actorIndex,
            )
          : context.allies;

      return {
        abilityId: ability.abilityId,
        effects: targets.map((target) => ({
          effectKind: "statChange",
          targetId: target.id,
          stat: "armour",
          amount: armourGranted,
        })),
      };
    }
    case "yip-strike": {
      // Every hit is planned up front from the snapshot (the human's call):
      // each picks a uniformly random opponent whose snapshot hp is above
      // 0, so the same enemy can be picked twice, and a later hit can land
      // on an enemy an earlier hit already dropped — a lucky break for the
      // player. With no such opponent, nothing is planned.
      const level = levelFromExperience(context.actor.experience);
      const hitCount = ability.hitCountByLevel[level - 1];
      const damagePerHit = ability.damagePerHitByLevel[level - 1];
      const standingOpponents = context.opponents.filter(
        (opponent) => opponent.hp > 0,
      );

      if (standingOpponents.length === 0) {
        return null;
      }

      return {
        abilityId: ability.abilityId,
        effects: Array.from({ length: hitCount }, () => ({
          effectKind: "damage" as const,
          targetId:
            standingOpponents[
              context.chooseRandomIndex(standingOpponents.length)
            ].id,
          amount: damagePerHit,
        })),
      };
    }
    default: {
      // The trigger guard plus the cases above narrow `ability` itself to
      // never here; a new onBattleStartBuffs ability without a case would
      // not be never, so this is a compile error until it gets one.
      const unreachableAbility: never = ability;
      throw new Error(
        `No battle-start plan for ability: ${(unreachableAbility as CharacterAbility).abilityId}`,
      );
    }
  }
}
