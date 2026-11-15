"use client";

import { useDroppable } from "@dnd-kit/react";
import { useTranslations } from "next-intl";
import type { CampClickTarget, CampTargetPresentation } from "./campSelection";

interface SellAreaProps {
  isShown: boolean;
  presentation: CampTargetPresentation;
  isEnabled: boolean;
  onClick: () => void;
}

// The box always occupies its space so the centred group (toggle, sell
// box, hint) never shifts. When hidden it is invisible, aria-hidden (so it
// doesn't leak into accessible names) and inert (no tabbing or clicking),
// and its droppable is disabled. The dashed outline is the "empty button"
// look from the human's ruling. The human tunes sizes and colours.
export function SellArea({
  isShown,
  presentation,
  isEnabled,
  onClick,
}: SellAreaProps) {
  const t = useTranslations("common");

  // The sell area is only ever a drop target, never a drag source.
  const { ref: droppableRef, isDropTarget } = useDroppable({
    id: "sell-area",
    data: {
      campClickTarget: { targetKind: "sellArea" } satisfies CampClickTarget,
    },
    disabled: !isShown,
  });

  const presentationClassName =
    presentation === "eligible"
      ? isDropTarget
        ? "border-solid border-emerald-500 bg-emerald-500/10"
        : "border-emerald-400"
      : "";

  return (
    <button
      ref={droppableRef}
      type="button"
      data-sell-area
      data-sell-area-shown={String(isShown)}
      data-camp-target-presentation={presentation}
      aria-hidden={isShown ? undefined : true}
      inert={!isShown}
      disabled={!isEnabled}
      onClick={onClick}
      className={`flex min-h-0 w-full flex-1 items-center justify-center rounded-md border-2 border-dashed border-(--color-parchment-200) bg-transparent text-lg font-bold uppercase tracking-wide text-(--color-parchment-100) [text-shadow:0_1px_1px_rgba(0,0,0,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isShown ? "" : "invisible"} ${presentationClassName}`}
    >
      {t("sellLabel")}
    </button>
  );
}
