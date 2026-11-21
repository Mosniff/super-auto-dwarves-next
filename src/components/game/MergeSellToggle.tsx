"use client";

import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";

interface MergeSellToggleProps {
  isMergeOrSellModeActive: boolean;
  isLatched: boolean;
  onClick: () => void;
  isDisabled: boolean;
}

const MODE_LABELS = [
  { mode: "reposition", translationKey: "repositionLabel" },
  { mode: "mergeOrSell", translationKey: "mergeSellToggle" },
] as const;

// Reposition and merge/sell are deliberately equal states — neither looks
// "on" or "off" — so no colour on the track signals one over the other.
// One mode label sits above a short, fixed-width track and names the
// current mode, crossfading when it changes; both words share one grid
// cell, so the label's space always fits the wider word and never
// changes. The knob's position (left for reposition, right for
// merge/sell) is still the state cue, and the lock inside the knob shows
// the latch. The "(hold SHIFT)" hint is always shown under the track.
//
// Screen readers get the toggle's name ("Merge / Sell") through aria-label
// and the latch through aria-pressed, so the accessible name is unchanged
// whichever mode is showing; the visible mode label and hint are
// aria-hidden decoration.
//
// Holding Shift moves the knob (isMergeOrSellModeActive) without latching
// it; clicking latches the mode and shows the lock, which is what keeps
// working once Shift is released.
//
// Renders the toggle button, including its mode label and the "(hold SHIFT)"
// hint; the sell box is CampScreen's own reserved-space sibling in the
// trailing group (CLAUDE.md → "Camp: shop, roster and intents").
//
// The toggle is disabled while a shop card is held: the interaction mode
// never affects a shop hold (it buys or merge-buys in either mode), so the
// controls must tell the truth about being inert rather than looking live.
// A latch stays visible but inert — disabled:opacity-50 dims the whole
// button — mode label, track, knob, lock and hint — together.
export function MergeSellToggle({
  isMergeOrSellModeActive,
  isLatched,
  onClick,
  isDisabled,
}: MergeSellToggleProps) {
  const t = useTranslations("common");

  return (
    <div className="flex shrink-0 flex-col items-center gap-3">
      <button
        type="button"
        aria-pressed={isLatched}
        aria-label={t("mergeSellToggle")}
        data-merge-sell-toggle
        data-merge-sell-mode-active={String(isMergeOrSellModeActive)}
        data-merge-sell-latched={String(isLatched)}
        data-merge-sell-toggle-disabled={String(isDisabled)}
        disabled={isDisabled}
        onClick={onClick}
        className="flex flex-col items-center gap-1 rounded-md bg-transparent p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span aria-hidden="true" className="grid">
          {MODE_LABELS.map(({ mode, translationKey }) => {
            const isShown =
              (mode === "mergeOrSell") === isMergeOrSellModeActive;

            return (
              <span
                key={mode}
                data-merge-sell-mode-label={mode}
                data-merge-sell-mode-label-shown={String(isShown)}
                className={`col-start-1 row-start-1 whitespace-nowrap text-center text-sm font-bold uppercase tracking-wide text-(--color-parchment-100) [text-shadow:0_1px_1px_rgba(0,0,0,0.6)] motion-safe:transition-opacity motion-safe:duration-150 ${
                  isShown ? "opacity-100" : "opacity-0"
                }`}
              >
                {t(translationKey)}
              </span>
            );
          })}
        </span>
        <span
          aria-hidden="true"
          data-merge-sell-track
          className="relative block h-8 w-16 shrink-0 rounded-full bg-(--color-iron-900) ring-1 ring-(--color-iron-500)"
        >
          <span
            data-merge-sell-knob
            style={{
              left: isMergeOrSellModeActive
                ? "calc(100% - 1.75rem)"
                : "0.25rem",
            }}
            className="absolute top-1 flex size-6 items-center justify-center rounded-full bg-(--color-parchment-100) shadow motion-safe:transition-[left] motion-safe:duration-200"
          >
            {isLatched && (
              <span data-merge-sell-lock>
                <Lock
                  aria-hidden="true"
                  className="size-4 text-(--color-iron-900)"
                />
              </span>
            )}
          </span>
        </span>
        <span
          aria-hidden="true"
          data-merge-sell-shift-hint
          className="whitespace-nowrap text-xs italic text-(--color-parchment-100) opacity-80"
        >
          {t("mergeSellShiftHint")}
        </span>
      </button>
    </div>
  );
}
