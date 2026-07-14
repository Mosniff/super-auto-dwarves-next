"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROD_GRADIENT =
  "linear-gradient(to bottom, var(--color-parchment-200), var(--color-parchment-50) 45%, var(--color-parchment-400))";
const ROD_SHADOW = "0 2px 4px rgba(0,0,0,0.35)";

const NAVIGATION_BUTTON_CLASS_NAME =
  "self-center border-ink-700/40 bg-parchment-50 text-ink-700 hover:bg-parchment-200 hover:text-ink-900";

interface InfoScrollProps {
  currentBeatLines: string[];
  onAdvance: () => void;
  isFinished: boolean;
  onViewPreviousBeat: () => void;
  onViewNextBeat: () => void;
  canViewPrevious: boolean;
  canViewNext: boolean;
}

export function InfoScroll({
  currentBeatLines,
  onAdvance,
  isFinished,
  onViewPreviousBeat,
  onViewNextBeat,
  canViewPrevious,
  canViewNext,
}: InfoScrollProps) {
  return (
    <div className="flex h-full flex-col">
      <div
        className="-mx-1 h-4 rounded-full"
        style={{ background: ROD_GRADIENT, boxShadow: ROD_SHADOW }}
      />

      <div
        className="flex min-h-0 flex-1 flex-col bg-parchment-100 p-4"
        style={{ boxShadow: "inset 0 0 24px rgba(120,90,40,0.35)" }}
      >
        <div className="flex min-h-0 flex-1 items-stretch gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onViewPreviousBeat}
            disabled={!canViewPrevious}
            className={NAVIGATION_BUTTON_CLASS_NAME}
          >
            <ChevronLeft />
          </Button>

          {currentBeatLines.length > 0 ? (
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {currentBeatLines.map((currentBeatLine, index) => (
                <li key={index} className="text-sm text-ink-700">
                  {currentBeatLine}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-ink-700/30">
              —
            </div>
          )}

          <Button
            variant="outline"
            size="icon-sm"
            onClick={onViewNextBeat}
            disabled={!canViewNext}
            className={NAVIGATION_BUTTON_CLASS_NAME}
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="flex gap-2 pt-3">
          <Button
            variant="outline"
            size="sm"
            className="border-ink-700/40 bg-parchment-50 text-ink-700 hover:bg-parchment-200 hover:text-ink-900"
          >
            Pause
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onAdvance}
            disabled={isFinished}
            className="border-ink-700/40 bg-parchment-50 text-ink-700 hover:bg-parchment-200 hover:text-ink-900"
          >
            Advance
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-ink-700/40 bg-parchment-50 text-ink-700 hover:bg-parchment-200 hover:text-ink-900"
          >
            Auto
          </Button>
        </div>
      </div>

      <div
        className="-mx-1 h-4 rounded-full"
        style={{ background: ROD_GRADIENT, boxShadow: ROD_SHADOW }}
      />
    </div>
  );
}
