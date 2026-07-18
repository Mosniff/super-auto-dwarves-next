"use client";

import { motion, useReducedMotion, type Easing } from "motion/react";
import type { BeatType, Character } from "@/lib/battle/types";
import { CharacterCard } from "./CharacterCard";

interface ActiveCardProps {
  character?: Character;
  facing?: "left" | "right";
  currentBeatType?: BeatType;
}

// Starting values — the human tunes these by eye.
const WIND_UP_OFFSET_PX = 120;
const LUNGE_OFFSET_PX = 40;
const OVERSHOOT_OFFSET_PX = 8;
const LEAN_DEGREES = 15; // deep lean-back during wind-up
const FOLLOW_THROUGH_DEGREES = 5; // smaller swing past neutral on the lunge
const TOTAL_DURATION_S = 0.5;
const CLASH_KEYFRAME_TIMES = [0, 0.35, 0.55, 0.8, 1];
const CLASH_KEYFRAME_EASES: Easing[] = [
  "easeOut",
  "easeIn",
  "easeOut",
  "easeInOut",
];

export function ActiveCard({
  character,
  facing = "right",
  currentBeatType,
}: ActiveCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const isClashing = currentBeatType === "CLASH";
  // Reduced motion disables the clash animation entirely — cards sit fully
  // static rather than playing a scaled-down version.
  const shouldAnimateClash = isClashing && !prefersReducedMotion;

  // Player faces right and lunges toward +x; enemy faces left and lunges
  // toward -x — opposite signs make the two cards converge on each other.
  const lungeDirection = facing === "right" ? 1 : -1;
  // Cards lean BACK (away from their lunge) during wind-up. In CSS, positive rotate is
  // clockwise. Player (facing right) leans anti-clockwise (negative); enemy (facing left)
  // leans clockwise (positive). Note this is the OPPOSITE sign to lungeDirection.
  const leanDirection = facing === "right" ? -1 : 1;

  const windUpOffsetPx = WIND_UP_OFFSET_PX;
  const lungeOffsetPx = LUNGE_OFFSET_PX;
  const overshootOffsetPx = OVERSHOOT_OFFSET_PX;
  const totalDurationSeconds = TOTAL_DURATION_S;
  const leanDegrees = LEAN_DEGREES;
  const followThroughDegrees = FOLLOW_THROUGH_DEGREES;

  const clashKeyframeOffsetsPx = [
    0,
    -lungeDirection * windUpOffsetPx,
    lungeDirection * lungeOffsetPx,
    -lungeDirection * overshootOffsetPx,
    0,
  ];

  const clashKeyframeRotationDegrees = [
    0, // start: neutral
    leanDirection * leanDegrees, // 0.35 wind-up: deep lean back
    -leanDirection * followThroughDegrees, // 0.55 lunge: swung THROUGH neutral to a smaller opposite angle
    0, // 0.8 overshoot: already returned to neutral
    0, // 1 settle: neutral
  ];

  return (
    <motion.div
      className="shrink-0"
      // Re-triggers on every shouldAnimateClash false->true transition. This
      // relies on a non-CLASH beat (TURN_START) always separating
      // consecutive CLASH beats; if clashes ever become adjacent, this needs
      // a keyed remount instead of a prop-driven animate transition.
      animate={
        shouldAnimateClash
          ? { x: clashKeyframeOffsetsPx, rotate: clashKeyframeRotationDegrees }
          : { x: 0, rotate: 0 }
      }
      transition={
        shouldAnimateClash
          ? {
              duration: totalDurationSeconds,
              times: CLASH_KEYFRAME_TIMES,
              ease: CLASH_KEYFRAME_EASES,
            }
          : undefined
      }
    >
      <div
        className="relative h-64 w-48 shrink-0 overflow-hidden rounded-lg bg-slate-200 p-3"
        style={{ boxShadow: "var(--shadow-recess)" }}
      >
        {character ? (
          <CharacterCard
            character={character}
            facing={facing}
            variant="full"
            animateHpDrop={shouldAnimateClash}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-slate-50/30">
            —
          </div>
        )}
      </div>
    </motion.div>
  );
}
