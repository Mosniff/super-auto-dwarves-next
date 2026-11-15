"use client";

import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";

interface MergeSellToggleProps {
  isMergeOrSellModeActive: boolean;
  isLatched: boolean;
  onClick: () => void;
  isRosterDwarfHeld: boolean;
}

// Holding Shift moves the knob (isMergeOrSellModeActive) without latching
// it; clicking latches the mode and shows the lock, which is what keeps
// working once Shift is released. aria-pressed reports the latch, not the
// momentary Shift-held state, to screen readers — the toggle button
// itself is only ever "pressed" when clicking it again would unlatch it.
// Styling here is simple and token-free; the human tunes it.
export function MergeSellToggle({
  isMergeOrSellModeActive,
  isLatched,
  onClick,
  isRosterDwarfHeld,
}: MergeSellToggleProps) {
  const t = useTranslations("common");

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        aria-pressed={isLatched}
        data-merge-sell-toggle
        data-merge-sell-mode-active={String(isMergeOrSellModeActive)}
        data-merge-sell-latched={String(isLatched)}
        onClick={onClick}
        className="flex items-center gap-2 rounded-md bg-slate-700 px-3 py-2 text-sm font-medium text-white"
      >
        <span>{t("mergeSellToggle")}</span>
        <span
          className={`relative h-5 w-9 rounded-full transition-colors ${
            isMergeOrSellModeActive ? "bg-emerald-500" : "bg-slate-400"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              isMergeOrSellModeActive ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </span>
        {isLatched && (
          <span data-merge-sell-lock>
            <Lock aria-hidden="true" className="size-4" />
          </span>
        )}
      </button>
      {isRosterDwarfHeld && (
        <p className="max-w-28 text-center text-xs text-slate-600">
          {t("mergeSellHint")}
        </p>
      )}
    </div>
  );
}
