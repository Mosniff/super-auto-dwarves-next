"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import type { BeatCharacterEffect } from "@/lib/battle/beatCharacterEffects";
import type { ArmourBeat } from "./CharacterCard";
import { floatersForBeat, type BattleBeatFloaterKind } from "./floatersForBeat";

// The receivers react just after the caster (the human's call); keep in
// step with --ability-receive-delay.
export const ABILITY_RECEIVE_DELAY_S = 0.3;
// The clash lunge lands at 55% of ActiveCard's 0.5s clash; keep in step
// with --armour-break-delay.
export const ARMOUR_BREAK_DELAY_S = 0.28;

const FLOATER_RISE_Y = -40;
const FLOATER_DURATION_S = 1.2;
// Outgoing floaters fade over this when the beat changes (they are derived
// from the current beat, so a new beat removes them). The human tunes it.
const FLOATER_EXIT_DURATION_S = 0.15;

// Pure: derives a CharacterCard armourBeat from this beat's character
// effect, so RosterSlot and ActiveCard share one mapping.
export function armourBeatFromEffect(
  beatEffect: BeatCharacterEffect | undefined,
  beatKey: number | undefined,
): ArmourBeat | undefined {
  if (beatEffect === undefined || beatKey === undefined) {
    return undefined;
  }

  if (beatEffect.brokenFromArmour !== null) {
    return {
      armourBeatKind: "broken",
      beatKey,
      brokenFromArmour: beatEffect.brokenFromArmour,
    };
  }

  if (beatEffect.armourGained > 0) {
    return { armourBeatKind: "gained", beatKey };
  }

  return undefined;
}

interface BattleBeatFloatersProps {
  beatEffect: BeatCharacterEffect | undefined;
  beatKey: number | undefined;
}

const FLOATER_COLOR_CLASS_NAME: Record<BattleBeatFloaterKind, string> = {
  armourGain: "text-(--color-parchment-50)",
  armourBreak: "text-(--color-copper-300)",
  abilityHpLoss: "text-(--color-heart-red-400)",
};

export function BattleBeatFloaters({
  beatEffect,
  beatKey,
}: BattleBeatFloatersProps) {
  const prefersReducedMotion = useReducedMotion();
  const t = useTranslations("battle");

  if (prefersReducedMotion) {
    return null;
  }

  const floaters = floatersForBeat(beatEffect, beatKey);

  return (
    <AnimatePresence>
      {floaters.map((floater) => (
        <motion.span
          key={floater.floaterKey}
          data-battle-beat-floater={floater.floaterKind}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-1/3 z-20 text-center text-lg font-bold [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] ${FLOATER_COLOR_CLASS_NAME[floater.floaterKind]}`}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [0, FLOATER_RISE_Y], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: FLOATER_DURATION_S,
            delay:
              floater.floaterKind === "armourBreak"
                ? ARMOUR_BREAK_DELAY_S
                : ABILITY_RECEIVE_DELAY_S,
          }}
          exit={{
            opacity: 0,
            transition: { duration: FLOATER_EXIT_DURATION_S },
          }}
        >
          {floater.floaterKind === "armourGain"
            ? t("armourGainFloater", { amount: floater.amount })
            : floater.floaterKind === "abilityHpLoss"
              ? t("abilityHpLossFloater", { amount: floater.amount })
              : t("armourBreakFloater")}
        </motion.span>
      ))}
    </AnimatePresence>
  );
}
