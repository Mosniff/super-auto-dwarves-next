"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { GamePhase } from "@/lib/game/types";

// Which phase the screen arrived from, in this session (Phase 12). Display-
// only, never sent anywhere; null on first load or reload, so arrival
// effects never replay after a reload.
const PhaseArrivalContext = createContext<GamePhase | null>(null);

export function PhaseArrivalProvider({
  phase,
  children,
}: {
  phase: GamePhase;
  children: ReactNode;
}) {
  const [phaseHistory, setPhaseHistory] = useState<{
    currentPhase: GamePhase;
    arrivedFromPhase: GamePhase | null;
  }>({ currentPhase: phase, arrivedFromPhase: null });

  // React's documented "storing information from previous renders" pattern:
  // adjusting state during render (rather than in an effect) means the
  // incoming screen sees its arrival on its own first render, not one tick
  // later.
  if (phaseHistory.currentPhase !== phase) {
    setPhaseHistory({
      currentPhase: phase,
      arrivedFromPhase: phaseHistory.currentPhase,
    });
  }

  return (
    <PhaseArrivalContext.Provider value={phaseHistory.arrivedFromPhase}>
      {children}
    </PhaseArrivalContext.Provider>
  );
}

export function useArrivedFromPhase(): GamePhase | null {
  return useContext(PhaseArrivalContext);
}
