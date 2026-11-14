"use client";

import { useTranslations } from "next-intl";
import { PendingSubmitButton } from "@/components/game/PendingSubmitButton";
import { usePhaseAdvanceAvailable } from "@/components/game/phaseAdvanceAvailability";
import type { GamePhase } from "@/lib/game/types";

interface PhaseAdvanceButtonProps {
  gamePhase: GamePhase;
  advanceGameAction: (formData: FormData) => Promise<void>;
}

const PHASE_ADVANCE_TRANSLATION_KEYS: Record<GamePhase, "toBattle" | "returnToCamp"> =
  {
    campPhase: "toBattle",
    battlePhase: "returnToCamp",
  };

// Replaces the two screen-specific advance buttons (camp's "To battle",
// battle's "Return to camp") with one button living in the header, so it
// stays fixed furniture across the swipe like the rest of the header. The
// present screen is the only one that knows whether advancing is currently
// allowed, so availability comes from usePhaseAdvanceAvailable rather than
// any game rule living here.
export function PhaseAdvanceButton({
  gamePhase,
  advanceGameAction,
}: PhaseAdvanceButtonProps) {
  const t = useTranslations("common");
  const isAvailable = usePhaseAdvanceAvailable(gamePhase);

  return (
    <form data-phase-advance action={advanceGameAction}>
      <input type="hidden" name="expectedCurrentPhase" value={gamePhase} />
      <PendingSubmitButton size="lg" disabled={!isAvailable}>
        {/* All labels share one grid cell so the button is always as wide
            as the widest label in the current locale and never resizes on
            a phase change; the non-current labels are invisible but still
            take up space, and are aria-hidden so the accessible name is
            only the current label; new phases join automatically via the
            map. */}
        <span className="grid">
          {(Object.keys(PHASE_ADVANCE_TRANSLATION_KEYS) as GamePhase[]).map(
            (labelGamePhase) => (
              <span
                key={labelGamePhase}
                className={`col-start-1 row-start-1 ${
                  labelGamePhase === gamePhase ? "" : "invisible"
                }`}
                aria-hidden={labelGamePhase === gamePhase ? undefined : true}
              >
                {t(PHASE_ADVANCE_TRANSLATION_KEYS[labelGamePhase])}
              </span>
            ),
          )}
        </span>
      </PendingSubmitButton>
    </form>
  );
}
