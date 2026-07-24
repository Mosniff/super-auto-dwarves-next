"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Easing,
} from "motion/react";
import type { BeatType, Character } from "@/lib/battle/types";
import { CharacterCard } from "./CharacterCard";

interface ActiveCardProps {
  character?: Character;
  facing?: "left" | "right";
  currentBeatType?: BeatType;
}

// Starting values — the human tunes these by eye.
// Scaled 1.5x to match the card's 50% size increase (h-64 w-48 -> h-96 w-72),
// so the lunge still reads at the same proportion of card width as before.
const WIND_UP_OFFSET_PX = 180;
const LUNGE_OFFSET_PX = 60;
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

const ENTRANCE_DURATION_S = 0.35;
const ENTRANCE_TILT_DEGREES = 45; // tuned by eye by the human
// Waits for the roster's front card to finish its launch off the bench
// before the active card flies on, so the handoff reads as "left the bench,
// then arrived" rather than both happening at once.
const ENTRANCE_DELAY_S = 0.5;

const EXIT_DISSOLVE_DURATION_S = 0.4; // tuned by eye by the human
const EXIT_SCALE_UP = 1.1;

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

  // Wraparound convention: player (facing right) enters from OFF THE LEFT (negative x);
  // enemy (facing left) enters from OFF THE RIGHT (positive x). Opposite sign to facing.
  // Expressed in vw (not a fixed px offset) so the start position is
  // guaranteed off-screen regardless of viewport width. Both branches are
  // strings so Framer interpolates a homogeneous vw -> px tween.
  const entranceInitialX = prefersReducedMotion
    ? "0px"
    : facing === "right"
      ? "-100vw"
      : "100vw";

  // The card leans BACK against its travel direction (trailing edge up), a
  // "braking into the spot" feel. Player travels rightward, so leaning back
  // tips the top left (negative rotation); enemy travels leftward, so
  // leaning back tips the top right (positive) — same sign pattern as the
  // clash leanDirection and the entrance x-direction.
  const entranceTiltDirection = facing === "right" ? -1 : 1;
  const entranceInitialRotate = prefersReducedMotion
    ? 0
    : entranceTiltDirection * ENTRANCE_TILT_DEGREES;

  const hasCharacter = Boolean(character);

  // Only real fighters entrance-slide/tilt and exit-poof; the empty "—"
  // placeholder is inert — it neither slides in nor dissolves out.
  const outerInitial = hasCharacter ? { x: entranceInitialX } : false;
  const outerAnimate = hasCharacter
    ? { x: "0px", rotate: [entranceInitialRotate, entranceInitialRotate, 0] }
    : { x: "0px" };
  const outerTransition = hasCharacter
    ? prefersReducedMotion
      ? { duration: 0 }
      : {
          delay: ENTRANCE_DELAY_S,
          duration: ENTRANCE_DURATION_S,
          ease: "easeOut" as const,
          rotate: {
            duration: ENTRANCE_DURATION_S,
            times: [0, 0.75, 1],
            ease: "easeOut" as const,
          },
        }
    : undefined;
  // The dying card dissolves IN PLACE (opacity + slight scale-up) — "poof" —
  // while AnimatePresence keeps it mounted long enough to play this as the
  // replacement's entrance plays simultaneously (default "sync" mode). x and
  // rotate are pinned to their resting values here — without this, exit
  // would otherwise interpolate x back toward entranceInitialX (its mount
  // origin), producing a backward jump instead of poofing where it rests.
  const outerExit = hasCharacter
    ? prefersReducedMotion
      ? { x: "0px", rotate: 0, opacity: 0, transition: { duration: 0 } }
      : {
          x: "0px",
          rotate: 0,
          opacity: 0,
          scale: EXIT_SCALE_UP,
          transition: { duration: EXIT_DISSOLVE_DURATION_S, ease: "easeOut" as const },
        }
    : { opacity: 0, transition: { duration: 0 } };

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        // The key must be the character id ALONE (no beat info) — a surviving
        // fighter keeps the same id across beats, so React keeps the same
        // element and this entrance does not replay. A new/replacement
        // fighter gets a new id, remounts, and slides in.
        key={character?.id ?? "empty"}
        // rotate's starting value comes from the first frame of its own
        // keyframe array below (kept out of `initial` to avoid conflicting
        // with that array), so only x needs an explicit initial here.
        initial={outerInitial}
        // rotate HOLDS at the tilt through most of the flight (still off-screen)
        // and only straightens in the final stretch, once the card is visible —
        // see the per-property `rotate` transition below for its own timing.
        animate={outerAnimate}
        transition={outerTransition}
        exit={outerExit}
        className="shrink-0"
      >
        <motion.div
          // Re-triggers on every shouldAnimateClash false->true transition. This
          // relies on a non-CLASH beat (TURN_START) always separating
          // consecutive CLASH beats; if clashes ever become adjacent, this needs
          // a keyed remount instead of a prop-driven animate transition.
          animate={
            shouldAnimateClash
              ? {
                  x: clashKeyframeOffsetsPx,
                  rotate: clashKeyframeRotationDegrees,
                }
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
          {character ? (
            <div
              className="relative h-96 w-72 overflow-hidden rounded-xl border-2 p-3"
              style={{
                backgroundColor: "var(--color-portrait-brown)",
                borderColor: "var(--color-portrait-brown-rim)",
                boxShadow:
                  "0 6px 16px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
              }}
            >
              <CharacterCard
                character={character}
                facing={facing}
                variant="full"
                animateHpDrop={shouldAnimateClash}
              />
            </div>
          ) : (
            // A wiped side's slot: no visible box (no background/border/shadow/
            // text) but the SAME h-96 w-72 footprint, so the flex row's layout
            // is unaffected — otherwise justify-center would re-center around
            // the surviving card and InfoScroll (the popLayout-class bug).
            <div className="h-96 w-72" />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
