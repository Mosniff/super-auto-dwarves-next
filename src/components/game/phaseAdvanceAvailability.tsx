"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useIsPresent } from "motion/react";
import type { GamePhase } from "@/lib/game/types";

// Carries whether the phase-advance button (in the header) may currently be
// clicked. The present screen is the one that knows this (camp: no intent
// pending; battle: playback finished), so it reports (gamePhase, isAvailable)
// up through this context rather than the header knowing any game rule.
// A report only counts for its own gamePhase — PhaseAdvanceButton compares
// the reported phase against its own, so a stale report left behind by a
// screen that's mid-exit during a swipe can never enable the wrong phase's
// button. This is UI-only convenience: the server independently re-checks
// the expected phase on every advance (CLAUDE.md -> "Security / anti-cheat
// model"), so a wrong or missing report can at worst disable a click, never
// forge one.

interface PhaseAdvanceAvailabilityReport {
  reportedGamePhase: GamePhase | null;
  isAvailable: boolean;
}

interface PhaseAdvanceAvailabilityContextValue {
  report: PhaseAdvanceAvailabilityReport;
  setReport: Dispatch<SetStateAction<PhaseAdvanceAvailabilityReport>>;
}

const PhaseAdvanceAvailabilityContext =
  createContext<PhaseAdvanceAvailabilityContextValue | null>(null);

export function PhaseAdvanceAvailabilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [report, setReport] = useState<PhaseAdvanceAvailabilityReport>({
    reportedGamePhase: null,
    isAvailable: false,
  });

  return (
    <PhaseAdvanceAvailabilityContext.Provider value={{ report, setReport }}>
      {children}
    </PhaseAdvanceAvailabilityContext.Provider>
  );
}

export function usePhaseAdvanceAvailable(gamePhase: GamePhase): boolean {
  const context = useContext(PhaseAdvanceAvailabilityContext);

  return (
    context !== null &&
    context.report.reportedGamePhase === gamePhase &&
    context.report.isAvailable
  );
}

export function useReportPhaseAdvanceAvailability(
  gamePhase: GamePhase,
  isAvailable: boolean,
): void {
  const context = useContext(PhaseAdvanceAvailabilityContext);
  const isPresent = useIsPresent();

  const setReport = context?.setReport;

  const report = useCallback(
    (nextReportedGamePhase: GamePhase, nextIsAvailable: boolean) => {
      setReport?.((previousReport) => {
        if (
          previousReport.reportedGamePhase === nextReportedGamePhase &&
          previousReport.isAvailable === nextIsAvailable
        ) {
          return previousReport;
        }

        return {
          reportedGamePhase: nextReportedGamePhase,
          isAvailable: nextIsAvailable,
        };
      });
    },
    [setReport],
  );

  useEffect(() => {
    if (context === null || !isPresent) {
      return;
    }

    report(gamePhase, isAvailable);
  }, [context, isPresent, gamePhase, isAvailable, report]);
}
