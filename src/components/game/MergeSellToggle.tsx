"use client";

import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";

interface MergeSellToggleProps {
  isMergeOrSellModeActive: boolean;
  isLatched: boolean;
  onClick: () => void;
  isDisabled: boolean;
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
//
// Renders only the toggle button — the hint and the sell box are
// CampScreen's own, reserved-space siblings in the trailing group
// (CLAUDE.md -> "Camp: shop, roster and intents").
//
// The toggle is disabled while a shop card is held: the interaction mode
// never affects a shop hold (it buys or merge-buys in either mode), so the
// controls must tell the truth about being inert rather than looking live.
// A latch stays visible but inert — disabled:opacity-50 dims the labels,
// the "(hold SHIFT)" sub-label, the track, the knob and the lock together.
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
        className="flex items-center gap-3 rounded-md bg-transparent p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
          data-merge-sell-side-label="mergeOrSell"
          aria-hidden="true"
          className="flex flex-col items-center justify-center whitespace-nowrap text-sm font-bold uppercase tracking-wide text-(--color-parchment-100) [text-shadow:0_1px_1px_rgba(0,0,0,0.6)]"
        >
          <span>{t("mergeSellToggle")}</span>
          {/* Absolutely positioned so the two main labels stay level with
              the track and the button's layout doesn't grow. Replaces the
              removed hint paragraph. Screen readers don't need it: Shift is
              a pointer convenience, and the toggle button is the accessible
              way to change mode — it's already inside the label's
              aria-hidden. */}
          <span
            data-merge-sell-shift-hint
            className="text-xs font-normal normal-case italic tracking-normal opacity-80"
          >
            {t("mergeSellShiftHint")}
          </span>
        </span>
      </button>
    </div>
  );
}
