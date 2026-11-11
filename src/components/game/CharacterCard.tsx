import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Character } from "@/lib/game/character";
import { hpBarFillRatio } from "@/lib/battle/hpBarFillRatio";
import { tierRomanNumeral } from "./characterCardDisplay";

interface CharacterCardProps {
  character: Character;
  facing?: "left" | "right";
  variant?: "compact" | "full";
  animateHpDrop?: boolean;
}

// Tuned by eye later by the human.
const HP_DRAIN_DELAY_MS = 250; // bar holds full, then drains ~at clash impact
const HP_DRAIN_TRANSITION_MS = 300; // existing bar drain duration
// Total number fade envelope; comfortably exceeds delay+drain so the number
// is hidden across the whole drain (containment, not precise alignment).
const HP_NUMBER_FADE_MS = 700;

// The active card renders at w-72 (288px) — see ActiveCard.tsx. Keep this in
// sync with that width so the portrait's srcset hint matches the rendered
// CSS size.
const ACTIVE_CARD_RENDERED_WIDTH_PX = "288px";

// Shared by both stat pills (attack and max-HP) so they cannot drift apart:
// padded, slightly rounded, glyph and number on a common inline baseline.
const STAT_PILL_BASE_CLASS_NAME =
  "inline-flex items-center rounded-md px-4 py-1";

// The tier and class badges use their own padding (from
// TIER_AND_CLASS_BADGE_STYLES below), not the stat pills'.
const BADGE_BASE_CLASS_NAME = "inline-flex items-center rounded-md";

// The tier and class markers stay in the DOM (so screen readers and tests
// still see them) but are hidden until the card is hovered or its slot
// button has keyboard focus. Touch has no hover and is to be revisited.
const HOVER_REVEAL_CLASS_NAME =
  "opacity-0 transition-opacity duration-150 group-hover/character-card:opacity-100 in-focus-visible:opacity-100";

const VARIANT_STYLES = {
  compact: {
    gap: "gap-1",
    name: "text-lg tracking-wide",
    stats: "text-sm px-2",
    portraitRounding: "rounded-sm",
    hpBarText: "text-sm",
    downedLabelText: "text-sm",
  },
  full: {
    gap: "gap-3",
    name: "text-xl",
    stats: "text-xl px-2",
    portraitRounding: "rounded-md",
    hpBarText: "text-base",
    downedLabelText: "text-xl",
  },
} as const;

// Tier/class marker sizes, tuned by eye separately from the stat pills above.
const TIER_AND_CLASS_BADGE_STYLES = {
  compact: {
    tier: "text-[8px] px-1 py-0.5",
    classLabel: "text-[7px] px-1 py-0.5",
  },
  full: { tier: "text-sm px-2 py-1", classLabel: "text-xs px-2 py-1" },
} as const;

export function CharacterCard({
  character,
  facing = "right",
  variant = "full",
  animateHpDrop = false,
}: CharacterCardProps) {
  const styles = VARIANT_STYLES[variant];
  const badgeStyles = TIER_AND_CLASS_BADGE_STYLES[variant];
  const hpFillRatio = hpBarFillRatio(character.hp, character.maxHp);
  const isDowned = character.hp <= 0;
  const t = useTranslations("common");
  const tCharacterClass = useTranslations("characterClass");
  const tier = character.tier;
  const characterClassIds = character.characterClassIds;

  return (
    <div
      className={`group/character-card flex h-full w-full flex-col items-center bg-(--color-portrait-brown) justify-center ${styles.gap}`}
    >
      <div
        className={`relative w-full flex-1 overflow-hidden ${styles.portraitRounding}`}
      >
        <div
          className="absolute inset-0"
          style={facing === "left" ? { transform: "scaleX(-1)" } : undefined}
        >
          <Image
            src="/character_portraits/placeholder.png"
            alt={character.name}
            fill
            className={`object-cover transition-[filter,opacity] duration-200 ease-out ${
              isDowned ? "grayscale brightness-75" : ""
            }`}
            sizes={ACTIVE_CARD_RENDERED_WIDTH_PX}
            quality={90}
            priority
          />
        </div>
        <span
          data-character-tier={tier}
          className={`absolute top-1 left-1 leading-none font-bold ${BADGE_BASE_CLASS_NAME} text-(--color-parchment-50) ${badgeStyles.tier} ${HOVER_REVEAL_CLASS_NAME}`}
          style={{
            backgroundImage:
              "linear-gradient(to bottom, var(--color-iron-300), var(--color-iron-700))",
            boxShadow: "var(--shadow-stat-pill)",
          }}
        >
          {tierRomanNumeral(tier)}
        </span>
        <div className="absolute top-1 right-1 flex flex-col items-end gap-1">
          {characterClassIds.map((characterClassId) => (
            <span
              key={characterClassId}
              data-character-class-id={characterClassId}
              className={`leading-none font-medium ${BADGE_BASE_CLASS_NAME} text-(--color-parchment-50) ${badgeStyles.classLabel} ${HOVER_REVEAL_CLASS_NAME}`}
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, var(--color-iron-300), var(--color-iron-700))",
                boxShadow: "var(--shadow-stat-pill)",
              }}
            >
              {tCharacterClass(characterClassId)}
            </span>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-1 p-1">
          <div>
            <span
              className={`min-w-0 flex-1 truncate bg-slate-200 border border-parchment-200 px-4 py-0.5 rounded-3xl font-semibold text-center text-parchment-200 ${styles.name}`}
            >
              {character.name}
            </span>
          </div>
        </div>
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/50 font-bold tracking-wide text-white uppercase transition-opacity duration-200 ease-out ${
            isDowned ? "opacity-100" : "opacity-0"
          } ${styles.downedLabelText}`}
        >
          {t("downed")}
        </div>
      </div>
      <div className={`w-full flex justify-between gap-1 ${styles.stats}`}>
        <span
          className={`shrink-0 leading-none ${STAT_PILL_BASE_CLASS_NAME} text-(--color-parchment-50)`}
          style={{
            backgroundImage:
              "linear-gradient(to bottom, var(--color-iron-300), var(--color-iron-700))",
            boxShadow: "var(--shadow-stat-pill)",
          }}
        >
          ⚔ {character.attack}
        </span>
        <span
          className={`shrink-0 leading-none ${STAT_PILL_BASE_CLASS_NAME} text-(--color-parchment-50)`}
          style={{
            backgroundImage:
              "linear-gradient(to bottom, var(--color-heart-red-400), var(--color-heart-red-700))",
            boxShadow: "var(--shadow-stat-pill)",
          }}
        >
          ❤ {character.maxHp}
        </span>
      </div>
      <div className="px-2 py-1 w-full">
        <div className="relative h-6 w-full overflow-hidden rounded-full bg-slate-400/40">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] ease-out"
            style={{
              width: `${hpFillRatio * 100}%`,
              transitionDuration: `${HP_DRAIN_TRANSITION_MS}ms`,
              transitionDelay: animateHpDrop ? `${HP_DRAIN_DELAY_MS}ms` : "0ms",
            }}
          />
          <span
            className={`absolute inset-0 flex items-center justify-center font-semibold text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.6)] ${styles.hpBarText}`}
            // Re-triggers on every animateHpDrop false->true transition, same
            // assumption as the ActiveCard clash re-trigger: a non-clash beat
            // separates consecutive clashes, so the style (and thus the
            // animation) is removed then re-applied each time.
            style={{
              animation: animateHpDrop
                ? `hp-number-drop-fade ${HP_NUMBER_FADE_MS}ms ease-in-out`
                : undefined,
            }}
          >
            {character.hp}/{character.maxHp}
          </span>
        </div>
      </div>
    </div>
  );
}
