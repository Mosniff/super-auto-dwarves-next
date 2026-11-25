"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/react";
import { useTranslations } from "next-intl";
import type { CampClickTarget, CampTargetPresentation } from "./campSelection";
import { campDropCollisionDetector } from "./campDropCollision";
import { DisplayedGold, useDisplayedGold } from "./headerGoldDisplay";

// "none" before the first change of a kind, then alternating, so that
// switching keyframe names restarts the animation on every change.
function changeCountParity(changeCount: number): "none" | "odd" | "even" {
  if (changeCount === 0) {
    return "none";
  }
  return changeCount % 2 === 1 ? "odd" : "even";
}

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
// wobbles a little. Each time the saved gold goes down (a purchase or a
// merge-buy), it dips with a cooler glow instead. A spend is read from the
// saved gold, not the shown gold: on arrival the start-of-camp sequence
// holds gold back, so the shown gold falls without anything being spent.
// The counts live in state, adjusted during render (React's "storing
// information from previous renders" pattern, as phaseArrival.tsx does).
// data-money-pile-last-gold-change ("none" | "gain" | "spend") picks which
// animation plays, and each one restarts on every change by switching
// between two identical keyframes (data-money-pile-gain-parity,
// data-money-pile-spend-parity). Arrival never animates: the history
// starts at the gold on the first render.
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
  const [goldChangeHistory, setGoldChangeHistory] = useState<{
    lastGold: number;
    lastDisplayedGold: number;
    gainCount: number;
    spendCount: number;
    lastGoldChange: "none" | "gain" | "spend";
  }>({
    lastGold: gold,
    lastDisplayedGold: displayedGold,
    gainCount: 0,
    spendCount: 0,
    lastGoldChange: "none",
  });
  if (
    goldChangeHistory.lastGold !== gold ||
    goldChangeHistory.lastDisplayedGold !== displayedGold
  ) {
    const isGain = displayedGold > goldChangeHistory.lastDisplayedGold;
    const isSpend = !isGain && gold < goldChangeHistory.lastGold;
    setGoldChangeHistory({
      lastGold: gold,
      lastDisplayedGold: displayedGold,
      gainCount: isGain
        ? goldChangeHistory.gainCount + 1
        : goldChangeHistory.gainCount,
      spendCount: isSpend
        ? goldChangeHistory.spendCount + 1
        : goldChangeHistory.spendCount,
      lastGoldChange: isGain
        ? "gain"
        : isSpend
          ? "spend"
          : goldChangeHistory.lastGoldChange,
    });
  }
  const goldGainParity = changeCountParity(goldChangeHistory.gainCount);
  const goldSpendParity = changeCountParity(goldChangeHistory.spendCount);

  const { ref: droppableRef, isDropTarget } = useDroppable({
    id: "money-pile",
    data: { campClickTarget },
    disabled: !isSellShown,
    collisionDetector: campDropCollisionDetector,
  });

  return (
    <div
      data-money-pile
      data-money-pile-last-gold-change={goldChangeHistory.lastGoldChange}
      data-money-pile-gain-parity={goldGainParity}
      data-money-pile-spend-parity={goldSpendParity}
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
