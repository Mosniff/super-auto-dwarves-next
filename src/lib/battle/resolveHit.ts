import type { Character } from "@/lib/game/character";
import type { BattleEventPayload } from "./types";

export type HitEventPayload = Extract<
  BattleEventPayload,
  { type: "DAMAGE" | "ARMOUR_DAMAGE" }
>;

export function resolveHit(
  target: Character,
  damageValue: number,
  sourceId: string,
): HitEventPayload {
  // The armour rule (Phase 12): while armour is above 0, a hit lands on
  // armour instead of hp. It removes up to the armour's value; if the hit is
  // at least the armour, the armour breaks to 0 and the rest is discarded.
  // Hp is never touched by a hit that lands on armour. All damage is
  // "physical" for now. damageValue is already clamped to >= 0 by the caller.
  if (target.armour > 0) {
    const armourRemoved = Math.min(damageValue, target.armour);
    return {
      type: "ARMOUR_DAMAGE",
      targetId: target.id,
      amount: armourRemoved,
      resultingArmour: target.armour - armourRemoved,
      source: sourceId,
    };
  }
  return {
    type: "DAMAGE",
    targetId: target.id,
    amount: damageValue,
    resultingHp: target.hp - damageValue,
    source: sourceId,
  };
}
