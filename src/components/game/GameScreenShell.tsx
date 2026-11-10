"use client";

import { motion, useIsPresent, useReducedMotion } from "motion/react";
import type { Character } from "@/lib/game/character";
import { RosterSlab, type RosterSlotInteraction } from "./RosterSlab";

export type { RosterSlotInteraction };

interface GameScreenShellProps {
  playerBenchCharacters: (Character | null)[];
  playerSlotInteraction?: RosterSlotInteraction;
  children: React.ReactNode;
}

export function GameScreenShell({
  playerBenchCharacters,
  playerSlotInteraction,
  children,
}: GameScreenShellProps) {
  const prefersReducedMotion = useReducedMotion();
  const isPresent = useIsPresent();

  // During a swipe both screens share one grid cell (see GameScreen).
  // Hiding the outgoing roster keeps the roster visually fixed; inert
  // stops clicks and focus on the departing screen.
  return (
    <main
      className="flex flex-1 flex-col"
      data-game-screen-presence={isPresent ? "present" : "exiting"}
    >
      <div
        data-game-screen-region="roster"
        inert={!isPresent}
        style={{
          boxShadow: "var(--shadow-slab)",
          borderBottom: "var(--slab-base-border)",
          visibility: isPresent ? "visible" : "hidden",
        }}
      >
        <RosterSlab
          characters={playerBenchCharacters}
          variant="player"
          slotInteraction={playerSlotInteraction}
        />
      </div>
      {/* The phase swipe, always forward: the outgoing screen's content
          slides out to the left while the incoming screen's content slides
          in from the right (see GameScreen). */}
      <motion.div
        data-game-screen-region="content"
        className="flex flex-1 flex-col"
        inert={!isPresent}
        initial={prefersReducedMotion ? false : { x: "100%" }}
        animate={{ x: "0%" }}
        exit={
          prefersReducedMotion
            ? { x: "0%", transition: { duration: 0 } }
            : { x: "-100%" }
        }
        transition={{ duration: 0.35, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </main>
  );
}
