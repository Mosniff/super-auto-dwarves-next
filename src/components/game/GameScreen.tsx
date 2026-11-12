"use client";

import { AnimatePresence } from "motion/react";
import { PhaseAdvanceAvailabilityProvider } from "@/components/game/phaseAdvanceAvailability";
import type { GamePhase } from "@/lib/game/types";

interface GameScreenProps {
  phase: GamePhase;
  header?: React.ReactNode;
  children: React.ReactNode;
}

// The persistent frame /play renders into, so the phase-change swipe has
// somewhere to keep both screens briefly mounted. `phase` is display-only —
// it comes straight from the server-rendered page and is used only as the
// AnimatePresence key that drives this animation; it is never sent
// anywhere (CLAUDE.md -> "Security / anti-cheat model"). While a swipe
// runs, the outgoing and incoming screens share this one grid cell, stacked
// on top of each other. `initial={false}` means the first load never
// swipes — only a later phase change does. `header` sits outside the swipe
// grid entirely, so it never moves during a phase change and persists
// across phase changes along with the rest of this frame.
export function GameScreen({ phase, header, children }: GameScreenProps) {
  return (
    <PhaseAdvanceAvailabilityProvider>
      <div className="flex flex-1 flex-col">
        {header}
        <div className="grid flex-1 grid-cols-1 grid-rows-1 overflow-hidden">
          <AnimatePresence initial={false}>
            <div
              key={phase}
              className="col-start-1 row-start-1 flex min-h-0 flex-col"
              data-game-screen-phase={phase}
            >
              {children}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </PhaseAdvanceAvailabilityProvider>
  );
}
