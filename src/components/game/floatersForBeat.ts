// The floaters a beat shows, derived during render (Phase 15). Keys include
// beatKey, so a new beat's floaters are new elements.
import type { BeatCharacterEffect } from "@/lib/battle/beatCharacterEffects";

export type BattleBeatFloaterKind = "armourGain" | "armourBreak" | "abilityHpLoss";

export interface BattleBeatFloater {
  floaterKey: string;
  floaterKind: BattleBeatFloaterKind;
  amount: number;
}

export function floatersForBeat(
  beatEffect: BeatCharacterEffect | undefined,
  beatKey: number | undefined,
): BattleBeatFloater[] {
  if (beatEffect === undefined || beatKey === undefined) {
    return [];
  }

  const floaters: BattleBeatFloater[] = [];

  if (beatEffect.armourGained > 0) {
    floaters.push({
      floaterKey: `armour-gain-${beatKey}`,
      floaterKind: "armourGain",
      amount: beatEffect.armourGained,
    });
  }

  if (beatEffect.brokenFromArmour !== null) {
    floaters.push({
      floaterKey: `armour-break-${beatKey}`,
      floaterKind: "armourBreak",
      amount: 0,
    });
  }

  // Ability hits only (the human's call, Phase 13); clash hits show none.
  if (beatEffect.abilityHpLost > 0) {
    floaters.push({
      floaterKey: `ability-hp-loss-${beatKey}`,
      floaterKind: "abilityHpLoss",
      amount: beatEffect.abilityHpLost,
    });
  }

  return floaters;
}
