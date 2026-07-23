"use client";

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

export function RosterSlot({
  character,
  facing = "right",
  isNext = false,
}: RosterSlotProps) {
  const prefersReducedMotion = useReducedMotion();
  const showNextHalo = isNext && Boolean(character);

  // Player slabs are facing="right" (front of the reversed row is at screen
  // right); enemy slabs are facing="left" (front of the normal row is at
  // screen left). Cards exit toward the front and enter from the back —
  // derived from the existing `facing` prop rather than threading a new one.
  const cardExitX = facing === "right" ? "100%" : "-100%";
  const cardEnterInitialX = facing === "right" ? "-100%" : "100%";

  return (
    <div className="relative">
      <div
        className="relative flex aspect-3/4 flex-col items-center justify-center gap-1 overflow-hidden rounded-md bg-slate-200 p-1.5"
        style={{ boxShadow: "var(--shadow-recess)" }}
      >
        {/* Only the CharacterCard animates — the recess and its padding
            never move. The outgoing/incoming cards are absolutely
            positioned within this (already relative, already
            overflow-hidden) recess so they overlap in place rather than
            reflowing the recess's own flex-col layout while both are
            briefly mounted. inset-0 (not the recess's p-1.5) so the card
            fills the full interior edge-to-edge, hiding the shaded recess
            entirely when occupied; overflow-hidden + rounded-md on the
            recess clips it to the same rounded corners. */}
        <AnimatePresence>
          {character && (
            <motion.div
              key={character.id}
              className="absolute inset-0"
              initial={
                prefersReducedMotion ? false : { x: cardEnterInitialX }
              }
              animate={{ x: "0%" }}
              exit={{
                x: prefersReducedMotion ? "0%" : cardExitX,
                transition: prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: SHUFFLE_EXIT_DURATION_S, ease: "easeIn" },
              }}
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
