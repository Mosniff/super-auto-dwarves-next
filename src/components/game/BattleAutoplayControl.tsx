"use client";

// Battle playback controls (Phase 14): the labelled Battle Autoplay group
// (Off / Slow / Fast) with Advance below it. It lives in the player
// roster's trailing area during battle, where camp's merge/sell toggle
// sits. It shows the player's chosen speed; no speed is pressed until the
// remembered speed is known. The human tunes its look.
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
  // false until the remembered speed has been read (Phase 14)
  isAutoplaySpeedKnown?: boolean;
}

export function BattleAutoplayControl({
  autoplaySpeed,
  onAutoplaySpeedChange,
  onAdvance,
  canAdvance,
  isAutoplaySpeedKnown = true,
}: BattleAutoplayControlProps) {
  const t = useTranslations("common");

  return (
    <div
      data-battle-autoplay-control
      className="flex flex-col items-center gap-(--battle-autoplay-section-gap) [zoom:var(--battle-autoplay-control-zoom)]"
    >
      <div
        role="group"
        aria-labelledby="battle-autoplay-label"
        className="flex flex-col items-center gap-(--battle-autoplay-label-gap)"
      >
        <span
          id="battle-autoplay-label"
          className="whitespace-nowrap text-sm font-bold uppercase tracking-wide text-(--color-parchment-100) [text-shadow:0_1px_1px_rgba(0,0,0,0.6)]"
        >
          {t("battleAutoplayLabel")}
        </span>
        <div className="flex gap-(--battle-autoplay-button-gap)">
          {SPEED_OPTIONS.map((option) => (
            <Button
              key={option.autoplaySpeed}
              variant="outline"
              size="sm"
              aria-pressed={
                isAutoplaySpeedKnown && option.autoplaySpeed === autoplaySpeed
              }
              data-autoplay-speed={option.autoplaySpeed}
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
