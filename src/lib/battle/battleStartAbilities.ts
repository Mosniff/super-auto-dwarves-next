import type { Character } from "@/lib/game/character";
import type {
  CharacterAbility,
  CharacterAbilityId,
} from "@/lib/game/characterAbilities";
import { findCharacterAbilityForCharacter } from "@/lib/game/characterAbilityLookup";
import { levelFromExperience } from "@/lib/game/characterExperience";

// Battle-start sub-phases, run in this order after the prepare beat and
// before turn 1 (Phase 12). Damage and summon sub-phases come later.
export const BATTLE_START_SUB_PHASES = ["onBattleStartBuffs"] as const;
export type BattleStartSubPhase = (typeof BATTLE_START_SUB_PHASES)[number];

// What an ability plans to do, chosen from the sub-phase's snapshot. The
// resolver turns each effect into outcome events against the CURRENT state,
// so effects stack. "damage" is used only by test fixtures this phase (the
// human's call: it lets the held-until-end-of-phase drops be tested now);
// it goes through resolveHit, so armour applies.
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
