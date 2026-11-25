"use client";

import { useTranslations } from "next-intl";
import { Skull, Swords, Tent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PendingSubmitButton } from "@/components/game/PendingSubmitButton";
import { useGameOverView } from "@/components/game/gameOverView";
import { usePhaseAdvanceAvailable } from "@/components/game/phaseAdvanceAvailability";
import type { GamePhase } from "@/lib/game/types";

interface PhaseAdvanceButtonProps {
  gamePhase: GamePhase;
  advanceGameAction: (formData: FormData) => Promise<void>;
  // True only when the server re-resolved the stored battle as lost
  // (Phase 13): the button becomes Continue, which swipes to the
  // game-over screen instead of advancing.
  isRunLost?: boolean;
}

type PhaseAdvanceLabelKey = "toBattle" | "returnToCamp" | "continue";

const PHASE_ADVANCE_TRANSLATION_KEYS: Record<GamePhase, PhaseAdvanceLabelKey> =
  {
    campPhase: "toBattle",
    battlePhase: "returnToCamp",
  };

// Where each label leads (Phase 16 header flare): it picks the pennant's
// colour (globals.css) through data-phase-advance-destination, and its icon.
const PHASE_ADVANCE_DESTINATIONS: Record<
  PhaseAdvanceLabelKey,
  "battle" | "camp" | "gameOver"
> = {
  toBattle: "battle",
  returnToCamp: "camp",
  continue: "gameOver",
};

const PHASE_ADVANCE_ICONS: Record<PhaseAdvanceLabelKey, typeof Swords> = {
  toBattle: Swords,
  returnToCamp: Tent,
  continue: Skull,
};

// The button's own look is the pennant inside it, so the shadcn button
// keeps only its behaviour, focus ring and disabled state.
const PENNANT_BUTTON_CLASS_NAME =
  "h-auto rounded-none bg-transparent p-0 shadow-none hover:bg-transparent";

// Every label the button can show, so its width never changes.
const ALL_PHASE_ADVANCE_LABEL_KEYS: PhaseAdvanceLabelKey[] = [
  "toBattle",
  "returnToCamp",
  "continue",
];

// Replaces the two screen-specific advance buttons (camp's "To battle",
// battle's "Return to camp") with one button living in the header, so it
// stays fixed furniture across the swipe like the rest of the header. The
// present screen is the only one that knows whether advancing is currently
// allowed, so availability comes from usePhaseAdvanceAvailable rather than
// any game rule living here. After a lost battle it is Continue: a plain
// button (no form, nothing sent) that swipes to the game-over screen; the
// run itself ends only through that screen's end-run intent (Phase 13).
export function PhaseAdvanceButton({
  gamePhase,
  advanceGameAction,
  isRunLost = false,
}: PhaseAdvanceButtonProps) {
  const t = useTranslations("common");
  const isAvailable = usePhaseAdvanceAvailable(gamePhase);
  const { isShowingGameOver, showGameOver } = useGameOverView();
  const isContinue = gamePhase === "battlePhase" && isRunLost;
  const currentLabelKey: PhaseAdvanceLabelKey = isContinue
    ? "continue"
    : PHASE_ADVANCE_TRANSLATION_KEYS[gamePhase];

  const destination = PHASE_ADVANCE_DESTINATIONS[currentLabelKey];

  // All labels (each with its icon) share one grid cell so the button is
  // always as wide as the widest label in the current locale and never
  // resizes; the non-current labels are invisible but still take up space,
  // and are aria-hidden so the accessible name is only the current label.
  // They sit on the pennant (Phase 16 header flare): a gold edge layer and
  // a face in the destination's colour, both cut to an arrowhead pointing
  // forward (globals.css → "Phase 16 header flare").
  const pennant = (
    <span data-phase-advance-pennant className="inline-flex">
      <span data-phase-advance-pennant-face className="inline-flex">
        <span className="grid">
          {ALL_PHASE_ADVANCE_LABEL_KEYS.map((labelKey) => {
            const LabelIcon = PHASE_ADVANCE_ICONS[labelKey];
            return (
              <span
                key={labelKey}
                className={`col-start-1 row-start-1 flex items-center justify-center gap-(--phase-advance-icon-gap) ${
                  labelKey === currentLabelKey ? "" : "invisible"
                }`}
                aria-hidden={labelKey === currentLabelKey ? undefined : true}
              >
                <LabelIcon aria-hidden="true" data-phase-advance-icon />
                {t(labelKey)}
              </span>
            );
          })}
        </span>
      </span>
    </span>
  );

  if (isContinue) {
    return (
      <div data-phase-advance data-phase-advance-destination={destination}>
        <Button
          type="button"
          size="lg"
          className={PENNANT_BUTTON_CLASS_NAME}
          disabled={!isAvailable || isShowingGameOver}
          onClick={showGameOver}
        >
          {pennant}
        </Button>
      </div>
    );
  }

  return (
    <form
      data-phase-advance
      data-phase-advance-destination={destination}
      action={advanceGameAction}
    >
      <input type="hidden" name="expectedCurrentPhase" value={gamePhase} />
      <PendingSubmitButton
        size="lg"
        className={PENNANT_BUTTON_CLASS_NAME}
        disabled={!isAvailable}
      >
        {pennant}
      </PendingSubmitButton>
    </form>
  );
}
