import { motion, useReducedMotion } from "motion/react";
import type { Character } from "@/lib/battle/types";

interface DiscardPileProps {
  downedCharacters: Character[];
  variant: "player" | "enemy";
}

const CARD_WIDTH_PX = 192; // w-48
const CARD_HEIGHT_PX = 256; // h-64

const RING_INSET_PX = 12; // breathing room around the card-back

const BADGE_SWELL_DURATION_S = 0.45;
const BADGE_SWELL_SCALE = 1.45;

export function DiscardPile({ downedCharacters }: DiscardPileProps) {
  const prefersReducedMotion = useReducedMotion();
  const downedCount = downedCharacters.length;
  const hasDowned = downedCount >= 1;

  return (
    <div
      className="relative shrink-0"
      style={{ width: CARD_WIDTH_PX, height: CARD_HEIGHT_PX }}
    >
      {hasDowned && (
        // Blank card-back — no character info, no portrait, no stats. Stays
        // exactly like this as the pile grows; only the count badge changes.
        <div
          className="absolute inset-0 rounded-md border"
          style={{
            backgroundColor: "var(--color-slate-300)",
            borderColor: "var(--color-iron-500)",
            boxShadow: "var(--shadow-recess), 0 4px 8px rgba(0,0,0,0.4)",
          }}
        />
      )}

      {hasDowned && (
        <motion.div
          // Remounts each time the count changes, which is what fires the
          // swell+glow — same keyed-remount trigger pattern as the active
          // card's entrance. The badge shows the NEW number from the start
          // of this animation.
          key={downedCount}
          className="absolute flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
          style={{
            top: -8,
            right: -8,
            backgroundColor: "var(--color-slate-300)",
            color: "var(--color-iron-300)",
          }}
          initial={prefersReducedMotion ? false : { scale: 1 }}
          animate={
            prefersReducedMotion
              ? { scale: 1 }
              : {
                  scale: [1, BADGE_SWELL_SCALE, 1],
                  boxShadow: [
                    "0 0 0px rgba(154,160,166,0)",
                    "0 0 12px rgba(154,160,166,0.9)",
                    "0 0 0px rgba(154,160,166,0)",
                  ],
                }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : {
                  duration: BADGE_SWELL_DURATION_S,
                  times: [0, 0.4, 1],
                  ease: "easeOut",
                }
          }
        >
          {downedCount}
        </motion.div>
      )}

      {/* Always-visible footprint — the pile's location, even when empty. */}
      <div
        className="pointer-events-none absolute rounded-lg border-2"
        style={{
          inset: -RING_INSET_PX,
          borderColor: "var(--color-iron-300)",
        }}
      >
        <span
          className="absolute left-1/2 -bottom-1.75 -translate-x-1/2 rounded-full px-1.5 py-0 text-[8px] font-bold tracking-wide uppercase"
          style={{
            backgroundColor: "var(--color-slate-300)",
            color: "var(--color-iron-300)",
          }}
        >
          downed
        </span>
      </div>
    </div>
  );
}
