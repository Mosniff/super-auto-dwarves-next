"use client";

// Battle playback controls (Phase 14; one row since Phase 15): the
// "Autoplay" label, then the labelled Off / Slow / Fast group, a divider and
// Advance. It lives in the player roster's leading area during battle.
// It shows the player's chosen speed; no speed is pressed until the
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
    // One row (Phase 15): the label on the left, and on the right the speed
    // group, a small divider, then Advance. justify-between spreads the two
    // across the leading area's full width.
    <div
      data-battle-autoplay-control
      className="flex items-center gap-(--battle-autoplay-section-gap) [zoom:var(--battle-autoplay-control-zoom)]"
    >
      <span
        id="battle-autoplay-label"
        className="whitespace-nowrap text-sm font-bold uppercase tracking-wide text-(--color-parchment-100) [text-shadow:0_1px_1px_rgba(0,0,0,0.6)]"
      >
        {t("battleAutoplayLabel")}
      </span>
      <div className="flex items-center gap-(--battle-autoplay-section-gap)">
        <div
          role="group"
          aria-labelledby="battle-autoplay-label"
          className="flex gap-(--battle-autoplay-button-gap)"
        >
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
        {/* Decorative groove like the header's divider, with its own
            variables (globals.css → battle autoplay) so the human can tune
            it for the stone slab. */}
        <span
          aria-hidden="true"
          data-battle-autoplay-divider
          className="inline-block w-px shrink-0 self-stretch rounded-full"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onAdvance}
          disabled={!canAdvance}
        >
          {t("advance")}
        </Button>
      </div>
    </div>
  );
}
