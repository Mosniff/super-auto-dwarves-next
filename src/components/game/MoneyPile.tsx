"use client";

import { useDroppable } from "@dnd-kit/react";
import { useTranslations } from "next-intl";
import type { CampClickTarget, CampTargetPresentation } from "./campSelection";
import { campDropCollisionDetector } from "./campDropCollision";
import { DisplayedGold } from "./headerGoldDisplay";

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
// Every size and colour is a globals.css variable ("Phase 16 money pile");
// the image's width is capped so it always fits the slab's height and the
// side area's width (which is min-w-0: anything wider would run under the
// slots).
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

  const { ref: droppableRef, isDropTarget } = useDroppable({
    id: "money-pile",
    data: { campClickTarget },
    disabled: !isSellShown,
    collisionDetector: campDropCollisionDetector,
  });

  return (
    <div
      data-money-pile
      className="flex w-full flex-1 flex-col items-center justify-center gap-(--money-pile-gap)"
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
        className="relative block aspect-4/3 max-w-full rounded-(--money-pile-radius) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          data-money-pile-image
          aria-hidden="true"
          className="absolute inset-0 rounded-(--money-pile-radius)"
        />
        {isSellShown && (
          <span
            data-money-pile-sell-prompt
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center rounded-(--money-pile-radius)"
          >
            {t("moneyPileSellPrompt")}
          </span>
        )}
      </button>
      <span data-money-pile-gold>
        <DisplayedGold gold={gold} />
      </span>
    </div>
  );
}
