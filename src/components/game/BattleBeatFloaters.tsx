"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import type { BeatCharacterEffect } from "@/lib/battle/beatCharacterEffects";
import type { AbilityCasterPulseKind } from "@/lib/battle/beatDurationMs";
import type { ArmourBeat } from "./CharacterCard";
import { battleFloaterTiming, floatersForBeat } from "./floatersForBeat";
import { animationTempoSeconds } from "@/lib/animationTempo";

const FLOATER_RISE_Y = -52;
// Quick fade-in, a long readable hold, fade-out.
const FLOATER_OPACITY_TIMES = [0, 0.15, 0.75, 1];
// Outgoing floaters fade over this when the beat changes (they are derived
// from the current beat, so a new beat removes them). The human tunes it.
const FLOATER_EXIT_DURATION_S = animationTempoSeconds(0.15);

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
  // the beat's pace (Phase 15): turn-start beats are quick, so their
  // floaters start and finish sooner
  abilityCasterPulse?: AbilityCasterPulseKind;
}

export function BattleBeatFloaters({
  beatEffect,
  beatKey,
  abilityCasterPulse = "normal",
}: BattleBeatFloatersProps) {
  const prefersReducedMotion = useReducedMotion();
  const t = useTranslations("battle");

  if (prefersReducedMotion) {
    return null;
  }

  const floaters = floatersForBeat(beatEffect, beatKey);

  return (
    <AnimatePresence>
      {floaters.map((floater) => {
        const floaterTiming = battleFloaterTiming(
          floater.floaterKind,
          abilityCasterPulse,
        );
        return (
          // Size, outline, shadow and fill come from globals.css → "Battle
          // floaters (Phase 15)", keyed on data-battle-beat-floater.
          <motion.span
            key={floater.floaterKey}
            data-battle-beat-floater={floater.floaterKind}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/3 z-20 text-center font-bold"
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: [0, FLOATER_RISE_Y], opacity: [0, 1, 1, 0] }}
            transition={{
              duration: floaterTiming.durationSeconds,
              delay: floaterTiming.delaySeconds,
              opacity: {
                duration: floaterTiming.durationSeconds,
                delay: floaterTiming.delaySeconds,
                times: FLOATER_OPACITY_TIMES,
              },
            }}
            exit={{
              opacity: 0,
              transition: { duration: FLOATER_EXIT_DURATION_S },
            }}
          >
            {floater.floaterKind === "armourGain"
              ? t("armourGainFloater", { amount: floater.amount })
              : floater.floaterKind === "hpLoss"
                ? t("abilityHpLossFloater", { amount: floater.amount })
                : t("armourBreakFloater")}
          </motion.span>
        );
      })}
    </AnimatePresence>
  );
}
