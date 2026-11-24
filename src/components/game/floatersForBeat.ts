// The floaters a beat shows, derived during render (Phase 15). Keys include
// beatKey, so a new beat's floaters are new elements.
import { animationTempoSeconds } from "@/lib/animationTempo";
import type { BeatCharacterEffect } from "@/lib/battle/beatCharacterEffects";
import type { AbilityCasterPulseKind } from "@/lib/battle/beatDurationMs";

export type BattleBeatFloaterKind = "armourGain" | "armourBreak" | "hpLoss";

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

  // Every hit that takes hp, ability or clash (Phase 15; Phase 13 floated
  // ability hits only).
  if (beatEffect.hpLost > 0) {
    floaters.push({
      floaterKey: `hp-loss-${beatKey}`,
      floaterKind: "hpLoss",
      amount: beatEffect.hpLost,
    });
  }

  return floaters;
}

// Each floater's delay and duration from its beat's pace. Floaters fit
// inside their beat (the human's ruling, Phase 15; FT3 guards it). All are
// base values, times the animation tempo.
export interface BattleFloaterTiming {
  delaySeconds: number;
  durationSeconds: number;
}

// The receivers react just after the caster (the human's call): keep in
// step with --ability-receive-delay, the flash's start.
const NORMAL_FLOATER_DELAY_S = 0.3;
// The clash lunge lands at 55% of ActiveCard's 0.5s clash: keep in step
// with --armour-break-delay.
const NORMAL_ARMOUR_BREAK_FLOATER_DELAY_S = 0.28;
const NORMAL_FLOATER_DURATION_S = 0.45;
// Matches --effect-flash-quick-delay (the quick flash on a turn-start beat).
const QUICK_FLOATER_DELAY_S = 0.05;
const QUICK_FLOATER_DURATION_S = 0.22;

export function battleFloaterTiming(
  floaterKind: BattleBeatFloaterKind,
  beatPace: AbilityCasterPulseKind,
): BattleFloaterTiming {
  if (beatPace === "quick") {
    return {
      delaySeconds: animationTempoSeconds(QUICK_FLOATER_DELAY_S),
      durationSeconds: animationTempoSeconds(QUICK_FLOATER_DURATION_S),
    };
  }
  return {
    delaySeconds: animationTempoSeconds(
      floaterKind === "armourBreak"
        ? NORMAL_ARMOUR_BREAK_FLOATER_DELAY_S
        : NORMAL_FLOATER_DELAY_S,
    ),
    durationSeconds: animationTempoSeconds(NORMAL_FLOATER_DURATION_S),
  };
}
