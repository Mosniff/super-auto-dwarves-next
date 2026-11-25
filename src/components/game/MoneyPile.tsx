"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/react";
import { useTranslations } from "next-intl";
import type { CampClickTarget, CampTargetPresentation } from "./campSelection";
import { campDropCollisionDetector } from "./campDropCollision";
import { DisplayedGold, useDisplayedGold } from "./headerGoldDisplay";

interface MoneyPileProps {
  gold: number;
  // A roster dwarf is in hand (clicked or dragged), so the pile is a sell
  // target.
  isSellShown: boolean;
  sellButtonLabel: string;
  presentation: CampTargetPresentation;
  isEnabled: boolean;
  onClick: () => void;
}

// Phase 16: the camp roster slab's left-hand area. A sack of gold (for now
// a placeholder block, [data-money-pile-image], until the image exists)
// with the gold count below it. While a roster dwarf is held it is also
// the sell target, a click and drop target: it highlights and "SELL?"
// appears over it. Otherwise its button stays mounted but inert,
// aria-hidden and not a drop target — the pattern the split zones use, so
// a target that appears mid-drag is enabled rather than mounted. The gold
// count is DisplayedGold, so it counts up with the header during the
// start-of-camp sequence.
//
// Each time the displayed gold goes up (a camp-start ability's gold
// floater, or a sale's gold arriving), the pile swells, glows gold and
// wobbles a little; spending doesn't. The gain count lives in state,
// adjusted during render (React's "storing information from previous
// renders" pattern, as phaseArrival.tsx does), and the animation restarts
// on every gain by switching between two identical keyframes
// (data-money-pile-gain-parity). Arrival never pulses: the count starts at
// the gold shown on the first render.
//
// It fills the slab's left-hand area: the image box (the sell button)
// takes all the height the gold count leaves, and the image is contained
// in it, so the pile can never run under the slots (the area is min-w-0)
// and grows with the window. Every size and colour is a globals.css
// variable ("Phase 16 money pile").
export function MoneyPile({
  gold,
  isSellShown,
  sellButtonLabel,
  presentation,
  isEnabled,
  onClick,
}: MoneyPileProps) {
  const t = useTranslations("common");
  const campClickTarget: CampClickTarget = { targetKind: "moneyPile" };

  const displayedGold = useDisplayedGold(gold);
  const [goldGainHistory, setGoldGainHistory] = useState({
    lastDisplayedGold: displayedGold,
    gainCount: 0,
  });
  if (goldGainHistory.lastDisplayedGold !== displayedGold) {
    setGoldGainHistory({
      lastDisplayedGold: displayedGold,
      gainCount:
        displayedGold > goldGainHistory.lastDisplayedGold
          ? goldGainHistory.gainCount + 1
          : goldGainHistory.gainCount,
    });
  }
  const goldGainParity =
    goldGainHistory.gainCount === 0
      ? "none"
      : goldGainHistory.gainCount % 2 === 1
        ? "odd"
        : "even";

  const { ref: droppableRef, isDropTarget } = useDroppable({
    id: "money-pile",
    data: { campClickTarget },
    disabled: !isSellShown,
    collisionDetector: campDropCollisionDetector,
  });

  return (
    <div
      data-money-pile
      data-money-pile-gain-parity={goldGainParity}
      className="flex h-full w-full flex-col items-center gap-(--money-pile-gap) p-(--money-pile-padding)"
    >
      <button
        ref={droppableRef}
        type="button"
        aria-label={sellButtonLabel}
        aria-hidden={isSellShown ? undefined : true}
        inert={!isSellShown}
        disabled={!isEnabled}
        onClick={onClick}
        data-money-pile-sell
        data-money-pile-sell-shown={String(isSellShown)}
        data-camp-target-presentation={presentation}
        data-money-pile-drop-target={String(isSellShown && isDropTarget)}
        className="relative block min-h-0 w-full flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          data-money-pile-image
          aria-hidden="true"
          className="absolute inset-0"
        />
        {isSellShown && (
          <span
            data-money-pile-sell-prompt
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center"
          >
            {t("moneyPileSellPrompt")}
          </span>
        )}
      </button>
      <span data-money-pile-gold className="shrink-0">
        <DisplayedGold gold={gold} />
      </span>
    </div>
  );
}
