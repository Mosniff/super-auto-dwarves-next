"use client";

import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";

interface MergeSellToggleProps {
  isMergeOrSellModeActive: boolean;
  isLatched: boolean;
  onClick: () => void;
  isRosterDwarfHeld: boolean;
}

// Reposition and merge/sell are deliberately equal states — neither looks
// "on" or "off" — so no colour on the track signals one over the other.
// The labels flank a short, fixed-width track; the knob's position (left
// for reposition, right for merge/sell) is still the only state cue, and
// the lock inside the knob shows the latch.
//
// Screen readers get the toggle's name ("Merge / Sell") through aria-label
// and the latch through aria-pressed, so the accessible name stays stable
// regardless of which side the knob is on; the visible "Reposition" /
// "Merge / Sell" side labels are aria-hidden decoration.
//
// Holding Shift moves the knob (isMergeOrSellModeActive) without latching
// it; clicking latches the mode and shows the lock, which is what keeps
// working once Shift is released.
export function MergeSellToggle({
  isMergeOrSellModeActive,
  isLatched,
  onClick,
  isRosterDwarfHeld,
}: MergeSellToggleProps) {
  const t = useTranslations("common");

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-pressed={isLatched}
        aria-label={t("mergeSellToggle")}
        data-merge-sell-toggle
        data-merge-sell-mode-active={String(isMergeOrSellModeActive)}
        data-merge-sell-latched={String(isLatched)}
        onClick={onClick}
        className="flex items-center gap-3 rounded-md bg-transparent p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          data-merge-sell-side-label="reposition"
          aria-hidden="true"
          className="whitespace-nowrap text-sm font-bold uppercase tracking-wide text-(--color-parchment-100) [text-shadow:0_1px_1px_rgba(0,0,0,0.6)]"
        >
          {t("repositionLabel")}
        </span>
        <span
          aria-hidden="true"
          data-merge-sell-track
          className="relative block h-8 w-16 shrink-0 rounded-full bg-(--color-iron-900) ring-1 ring-(--color-iron-500)"
        >
          <span
            data-merge-sell-knob
            style={{
              left: isMergeOrSellModeActive ? "calc(100% - 1.75rem)" : "0.25rem",
            }}
            className="absolute top-1 flex size-6 items-center justify-center rounded-full bg-(--color-parchment-100) shadow motion-safe:transition-[left] motion-safe:duration-200"
          >
            {isLatched && (
              <span data-merge-sell-lock>
                <Lock aria-hidden="true" className="size-4 text-(--color-iron-900)" />
              </span>
            )}
          </span>
        </span>
        <span
          data-merge-sell-side-label="mergeOrSell"
          aria-hidden="true"
          className="whitespace-nowrap text-sm font-bold uppercase tracking-wide text-(--color-parchment-100) [text-shadow:0_1px_1px_rgba(0,0,0,0.6)]"
        >
          {t("mergeSellToggle")}
        </span>
      </button>
      {isRosterDwarfHeld && (
        <p className="text-center text-sm text-(--color-parchment-200)">
          {t("mergeSellHint")}
        </p>
      )}
    </div>
  );
}
