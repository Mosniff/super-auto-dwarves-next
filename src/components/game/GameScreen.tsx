"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { GameOverViewProvider } from "@/components/game/gameOverView";
import { PhaseAdvanceAvailabilityProvider } from "@/components/game/phaseAdvanceAvailability";
import { PhaseArrivalProvider } from "@/components/game/phaseArrival";
import { HeaderGoldDisplayProvider } from "@/components/game/headerGoldDisplay";
import type { GamePhase } from "@/lib/game/types";

interface GameScreenProps {
  phase: GamePhase;
  header?: React.ReactNode;
  children: React.ReactNode;
  // The screen the header's Continue swipes to after a lost battle (Phase
  // 13); given only when the server says the stored battle was lost.
  gameOverScreen?: React.ReactNode;
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
// across phase changes along with the rest of this frame. The swipe keys
// on the displayed screen rather than the phase, so a lost battle can also
// swipe to the game-over screen without any phase change (Phase 13).
export function GameScreen({
  phase,
  header,
  children,
  gameOverScreen,
}: GameScreenProps) {
  const [isShowingGameOver, setIsShowingGameOver] = useState(false);
  const isShowingGameOverScreen =
    isShowingGameOver && gameOverScreen !== undefined;
  const displayedScreenKey = isShowingGameOverScreen ? "gameOver" : phase;

  return (
    <GameOverViewProvider
      value={{
        isShowingGameOver: isShowingGameOverScreen,
        showGameOver: () => setIsShowingGameOver(true),
      }}
    >
      <PhaseAdvanceAvailabilityProvider>
        <PhaseArrivalProvider phase={phase}>
          <HeaderGoldDisplayProvider>
            <div className="flex flex-1 flex-col">
              {header}
              <div className="grid flex-1 grid-cols-1 grid-rows-1 overflow-hidden">
                <AnimatePresence initial={false}>
                  <div
                    key={displayedScreenKey}
                    className="col-start-1 row-start-1 flex min-h-0 flex-col"
                    data-game-screen-phase={phase}
                    data-game-screen-view={displayedScreenKey}
                  >
                    {isShowingGameOverScreen ? gameOverScreen : children}
                  </div>
                </AnimatePresence>
              </div>
            </div>
          </HeaderGoldDisplayProvider>
        </PhaseArrivalProvider>
      </PhaseAdvanceAvailabilityProvider>
    </GameOverViewProvider>
  );
}
