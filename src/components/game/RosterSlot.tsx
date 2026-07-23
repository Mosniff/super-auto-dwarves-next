"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Character } from "@/lib/battle/types";
import { CharacterCard } from "./CharacterCard";

interface RosterSlotProps {
  character?: Character;
  facing?: "left" | "right";
  isNext?: boolean;
}

const SHUFFLE_EXIT_DURATION_S = 0.3;
const SHUFFLE_ENTER_DELAY_S = 0.15;
const SHUFFLE_ENTER_DURATION_S = 0.3;

// Grandiose promotion-exit — only the FRONT (on-deck) slot's outgoing card
// uses these, when it's promoted into the active zone.
const LAUNCH_TOTAL_DURATION_S = 0.5;
const LAUNCH_WINDUP_SCALE = 1.2;
const LAUNCH_SHAKE_DEGREES = 3;
const LAUNCH_BRIGHTNESS = 1.35; // brightness pulse peak during wind-up
const LAUNCH_EXIT_X = "400%"; // well past the slot's clip boundary

export function RosterSlot({
  character,
  facing = "right",
  isNext = false,
}: RosterSlotProps) {
  const prefersReducedMotion = useReducedMotion();
  const showNextHalo = isNext && Boolean(character);
  // Only the front slot's exit is the grandiose wind-up + launch; every other
  // slot keeps the plain slide. Reduced motion overrides this to an instant
  // pin, same as the plain exit.
  const shouldUseGrandioseExit = isNext && !prefersReducedMotion;

  // While true, the recess renders WITHOUT overflow-hidden so the front
  // slot's launching card can fly clear of the slot boundary instead of
  // being clipped at its edge. Set when this front slot's occupant just
  // changed away (its old card is beginning its grandiose exit); cleared by
  // AnimatePresence.onExitComplete once that exit animation actually
  // finishes, so it can never desync from the real animation length.
  const [isLaunchingCardOut, setIsLaunchingCardOut] = useState(false);
  const previousCharacterIdRef = useRef(character?.id);

  useEffect(() => {
    const previousCharacterId = previousCharacterIdRef.current;
    const occupantChangedAway =
      previousCharacterId !== undefined &&
      previousCharacterId !== character?.id;

    if (isNext && !prefersReducedMotion && occupantChangedAway) {
      setIsLaunchingCardOut(true);
    }

    previousCharacterIdRef.current = character?.id;
  }, [character?.id, isNext, prefersReducedMotion]);

  // Player slabs are facing="right" (front of the reversed row is at screen
  // right); enemy slabs are facing="left" (front of the normal row is at
  // screen left). Cards exit toward the front and enter from the back —
  // derived from the existing `facing` prop rather than threading a new one.
  const cardExitX = facing === "right" ? "100%" : "-100%";
  const cardEnterInitialX = facing === "right" ? "-100%" : "100%";
  // Same direction convention as cardExitX, just with the launch's much
  // larger travel distance.
  const launchExitX = facing === "right" ? LAUNCH_EXIT_X : `-${LAUNCH_EXIT_X}`;

  return (
    <div className="relative">
      <div
        className={`relative flex aspect-3/4 flex-col items-center justify-center gap-1 rounded-md bg-slate-200 p-1.5 ${
          isLaunchingCardOut ? "overflow-visible" : "overflow-hidden"
        }`}
        style={{ boxShadow: "var(--shadow-recess)" }}
      >
        {/* Only the CharacterCard animates — the recess and its padding
            never move. The outgoing/incoming cards are absolutely
            positioned within this (already relative) recess so they overlap
            in place rather than reflowing the recess's own flex-col layout
            while both are briefly mounted. inset-0 (not the recess's p-1.5)
            so the card fills the full interior edge-to-edge, hiding the
            shaded recess entirely when occupied; overflow-hidden +
            rounded-md on the recess clips it to the same rounded corners —
            except during the front slot's launch (isLaunchingCardOut), when
            overflow is briefly lifted so the card can fly clear. The card
            wrapper itself also carries its own overflow-hidden rounded-md
            (matching the recess's), so it already looks rounded on its own
            terms when the recess's clip lifts — no corner "pop". */}
        <AnimatePresence
          onExitComplete={() => setIsLaunchingCardOut(false)}
        >
          {character && (
            <motion.div
              key={character.id}
              className="absolute inset-0 overflow-hidden rounded-md"
              initial={
                prefersReducedMotion ? false : { x: cardEnterInitialX }
              }
              animate={{ x: "0%" }}
              exit={
                prefersReducedMotion
                  ? { x: "0%", transition: { duration: 0 } }
                  : shouldUseGrandioseExit
                    ? {
                        // Wind-up (t 0 -> 0.5): x holds at "0%" (identical
                        // start/mid keyframe = no movement) while scale,
                        // filter, and rotate do their thing. Launch (t 0.5
                        // -> 1): x whips out to launchExitX on a sharp
                        // easeIn, while scale/filter/rotate settle back to
                        // their resting values.
                        x: ["0%", "0%", launchExitX],
                        scale: [1, LAUNCH_WINDUP_SCALE, 1],
                        filter: [
                          "brightness(1)",
                          `brightness(${LAUNCH_BRIGHTNESS})`,
                          "brightness(1)",
                        ],
                        // Four small back-and-forth tilts, all within the
                        // wind-up half; already back at 0 by t=0.5, and
                        // stays there through the launch.
                        rotate: [
                          0,
                          LAUNCH_SHAKE_DEGREES,
                          -LAUNCH_SHAKE_DEGREES,
                          LAUNCH_SHAKE_DEGREES,
                          -LAUNCH_SHAKE_DEGREES,
                          0,
                          0,
                        ],
                        transition: {
                          duration: LAUNCH_TOTAL_DURATION_S,
                          x: {
                            duration: LAUNCH_TOTAL_DURATION_S,
                            times: [0, 0.5, 1],
                            ease: "easeIn",
                          },
                          scale: {
                            duration: LAUNCH_TOTAL_DURATION_S,
                            times: [0, 0.5, 1],
                            ease: "easeInOut",
                          },
                          filter: {
                            duration: LAUNCH_TOTAL_DURATION_S,
                            times: [0, 0.5, 1],
                            ease: "easeInOut",
                          },
                          rotate: {
                            duration: LAUNCH_TOTAL_DURATION_S,
                            times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 1],
                            ease: "easeInOut",
                          },
                        },
                      }
                    : {
                        x: cardExitX,
                        transition: {
                          duration: SHUFFLE_EXIT_DURATION_S,
                          ease: "easeIn",
                        },
                      }
              }
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : {
                      delay: SHUFFLE_ENTER_DELAY_S,
                      duration: SHUFFLE_ENTER_DURATION_S,
                      ease: "easeOut",
                    }
              }
            >
              <CharacterCard character={character} facing={facing} />
            </motion.div>
          )}
        </AnimatePresence>
        {!character && (
          <span className="select-none text-[10px] font-medium uppercase tracking-wide text-slate-50/30">
            Empty
          </span>
        )}
      </div>
      {showNextHalo && (
        <div
          className="pointer-events-none absolute -inset-2 rounded-lg border-2"
          style={{ borderColor: "var(--color-parchment-300)" }}
        >
          <span
            className="absolute left-1/2 -bottom-1.75 -translate-x-1/2 rounded-full px-1.5 py-0 text-[8px] font-bold tracking-wide uppercase"
            style={{
              backgroundColor: "var(--color-slate-300)",
              color: "var(--color-parchment-300)",
            }}
          >
            next
          </span>
        </div>
      )}
    </div>
  );
}
