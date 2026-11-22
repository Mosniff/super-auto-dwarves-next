"use client";

// Battle playback controls (Phase 14): the labelled Battle Autoplay group
// (Off / Slow / Fast) with Advance below it. It lives in the player
// roster's trailing area during battle, where camp's merge/sell toggle
// sits. The human tunes its look.
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { AutoplaySpeed } from "@/lib/battle/autoplaySpeed";

const SPEED_OPTIONS = [
  { autoplaySpeed: "off", translationKey: "autoplaySpeedOff" },
  { autoplaySpeed: "slow", translationKey: "autoplaySpeedSlow" },
  { autoplaySpeed: "fast", translationKey: "autoplaySpeedFast" },
] as const;

interface BattleAutoplayControlProps {
  autoplaySpeed: AutoplaySpeed;
  onAutoplaySpeedChange: (autoplaySpeed: AutoplaySpeed) => void;
  onAdvance: () => void;
  canAdvance: boolean;
  isFinished: boolean;
}

export function BattleAutoplayControl({
  autoplaySpeed,
  onAutoplaySpeedChange,
  onAdvance,
  canAdvance,
  isFinished,
}: BattleAutoplayControlProps) {
  const t = useTranslations("common");

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        role="group"
        aria-labelledby="battle-autoplay-label"
        className="flex flex-col items-center gap-1"
      >
        <span
          id="battle-autoplay-label"
          className="whitespace-nowrap text-sm font-bold uppercase tracking-wide text-(--color-parchment-100) [text-shadow:0_1px_1px_rgba(0,0,0,0.6)]"
        >
          {t("battleAutoplayLabel")}
        </span>
        <div className="flex">
          {SPEED_OPTIONS.map((option) => (
            <Button
              key={option.autoplaySpeed}
              variant="outline"
              size="sm"
              aria-pressed={option.autoplaySpeed === autoplaySpeed}
              data-autoplay-speed={option.autoplaySpeed}
              disabled={isFinished}
              onClick={() => onAutoplaySpeedChange(option.autoplaySpeed)}
            >
              {t(option.translationKey)}
            </Button>
          ))}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onAdvance}
        disabled={!canAdvance}
      >
        {t("advance")}
      </Button>
    </div>
  );
}
