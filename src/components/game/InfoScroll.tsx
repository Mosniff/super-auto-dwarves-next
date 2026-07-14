"use client";

import { Button } from "@/components/ui/button";

const ROD_GRADIENT =
  "linear-gradient(to bottom, var(--color-parchment-200), var(--color-parchment-50) 45%, var(--color-parchment-400))";
const ROD_SHADOW = "0 2px 4px rgba(0,0,0,0.35)";

interface InfoScrollProps {
  logLines: string[];
  onAdvance: () => void;
  isFinished: boolean;
}

export function InfoScroll({
  logLines,
  onAdvance,
  isFinished,
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
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {logLines.map((logLine, index) => (
            <li key={index} className="text-sm text-ink-700">
              {logLine}
            </li>
          ))}
        </ul>

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
