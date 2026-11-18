import Image from "next/image";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Character } from "@/lib/game/character";
import { hpBarFillRatio } from "@/lib/battle/hpBarFillRatio";
import { levelFromExperience } from "@/lib/game/characterExperience";
import {
  experienceBarCaption,
  experienceBarSegments,
  hpDisplayTone,
  tierRomanNumeral,
  type HpDisplayTone,
} from "./characterCardDisplay";

// The layout borrows a trading-card frame structure: a bordered, textured
// body holding a name bar, the portrait (carrying an optional HP or XP
// bar), a class bar, and a bottom row holding an optional level pill and
// the stats pill. Every size inside the frame comes from a card-* theme
// token defined in globals.css, each expressed relative to the card's own
// width (a CSS container query length), so one layout serves every card
// size — a ~100px shop tile and a 288px action card alike. The human tunes
// the numbers there, in one place. The expanded view is a separate
// component (ExpandedCharacterCard), not a variant of this card.

export type ArmourBeat =
  | { armourBeatKind: "gained"; beatKey: number }
  | { armourBeatKind: "broken"; beatKey: number; brokenFromArmour: number };

interface CharacterCardProps {
  character: Character;
  facing?: "left" | "right";
  animateHpDrop?: boolean;
  showHpBar?: boolean;
  showLevel?: boolean;
  showExperienceBar?: boolean;
  showInlineExperienceBar?: boolean;
  showRevealWash?: boolean;
  armourBeat?: ArmourBeat;
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

// The human tunes the colour and width here.
const CARD_FRAME_BORDER_CLASS_NAME = "border-iron-900";

const DARK_TEXT_CLASS_NAME = "text-(--color-iron-900)";

const PANEL_BAR_CLASS_NAME = `flex shrink-0 items-center gap-card-bar-gap rounded-card-bar px-card-bar-x py-card-bar-y ${DARK_TEXT_CLASS_NAME}`;

const HP_TONE_TEXT_CLASS_NAME: Record<HpDisplayTone, string> = {
  full: "text-(--color-parchment-50)",
  damaged: "text-red-400",
  buffed: "text-emerald-400",
};

// The segment row shared by the roster's hover-revealed overlay bar and
// the shop's always-visible inline bar — just the segments and the MAX
// overlay, no label and no caption.
function ExperienceSegments({ experience }: { experience: number }) {
  const t = useTranslations("common");
  const { segmentCount, filledSegmentCount, isMaxLevel } =
    experienceBarSegments(experience);

  return (
    <div className="relative flex h-card-xp-bar-height w-full gap-card-xp-segment-gap">
      {Array.from({ length: segmentCount }, (_, segmentIndex) => (
        <span
          key={segmentIndex}
          data-experience-segment={
            segmentIndex < filledSegmentCount ? "filled" : "empty"
          }
          className={`flex-1 rounded-full border-card-xp-segment border-(--experience-segment-border) ${
            segmentIndex < filledSegmentCount ? "bg-amber-400" : "bg-black/40"
          }`}
        />
      ))}
      {isMaxLevel && (
        <span className="absolute inset-0 flex items-center justify-center text-card-xp-max font-semibold text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.6)]">
          {t("experienceBarMax")}
        </span>
      )}
    </div>
  );
}

export function CharacterCard({
  character,
  facing = "right",
  animateHpDrop = false,
  showHpBar = false,
  showLevel = false,
  showExperienceBar = false,
  showInlineExperienceBar = false,
  showRevealWash = false,
  armourBeat,
}: CharacterCardProps) {
  const hpFillRatio = hpBarFillRatio(character.hp, character.maxHp);
  const isDowned = character.hp <= 0;
  const t = useTranslations("common");
  const tCharacterClass = useTranslations("characterClass");
  const tier = character.tier;
  const characterClassIds = character.characterClassIds;
  const hpTone = hpDisplayTone(character.hp, character.maxHp);
  const level = levelFromExperience(character.experience);
  const { isMaxLevel } = experienceBarSegments(character.experience);
  const experienceCaption = experienceBarCaption(character.experience);
  const shownArmour =
    armourBeat?.armourBeatKind === "broken"
      ? armourBeat.brokenFromArmour
      : character.armour;

  return (
    // @container, carrying no container-relative sizing of its own: an
    // element can't resolve a container query length against itself, only
    // against the nearest ancestor container, so this element is that
    // container and the frame inside it carries the container-relative
    // sizes (the card-* theme tokens). rounded-md still matches
    // RosterSlot's card wrapper, so the wrapper's clip and the card's
    // corners coincide.
    <div className="@container h-full w-full overflow-hidden rounded-md">
      <div
        className={`relative flex h-full w-full flex-col gap-card-frame-gap rounded-md border-card-frame p-card-frame-padding ${CARD_FRAME_BORDER_CLASS_NAME}`}
        style={{ background: "var(--texture-card-frame)" }}
      >
        <div
          className={`justify-between ${PANEL_BAR_CLASS_NAME}`}
          style={{
            background: "var(--texture-card-panel)",
            boxShadow: "var(--shadow-stat-pill)",
          }}
        >
          <span className="min-w-0 truncate text-card-title font-semibold leading-none">
            {character.name}
          </span>
          <span
            data-character-tier={tier}
            className="shrink-0 text-card-title font-bold leading-none"
          >
            {tierRomanNumeral(tier)}
          </span>
        </div>

        <div
          data-character-portrait
          className="relative mx-card-inset min-h-0 flex-1 overflow-hidden rounded-card-portrait"
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
            />
          </div>
          {showHpBar && (
            <div
              data-character-hp-bar
              className="absolute inset-x-card-hp-bar-inset bottom-card-hp-bar-inset"
            >
              <div className="relative h-card-hp-bar-height w-full overflow-hidden rounded-full bg-slate-400/40">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-[width] ease-out"
                  style={{
                    width: `${hpFillRatio * 100}%`,
                    transitionDuration: `${HP_DRAIN_TRANSITION_MS}ms`,
                    transitionDelay: animateHpDrop
                      ? `${HP_DRAIN_DELAY_MS}ms`
                      : "0ms",
                  }}
                />
                <span
                  className="absolute inset-0 flex items-center justify-center text-card-hp font-semibold text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.6)]"
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
          )}
          {showExperienceBar && (
            // aria-hidden: the level reaches screen readers through the
            // slot's label. Its visibility in camp is controlled by the
            // reveal rules in globals.css, not by this component. The
            // camp roster never shows the battle-only HP bar, so the two
            // never share this space. It sits mid-portrait, above the
            // reveal wash (see the z-order comment below). The label, bar
            // and caption reveal and fade as one unit, because the reveal
            // rules target this outer element.
            <div
              data-character-experience-bar
              data-experience-max-level={String(isMaxLevel)}
              aria-hidden="true"
              className="absolute inset-x-card-hp-bar-inset top-1/2 z-2 flex -translate-y-1/2 flex-col items-center gap-card-xp-text-gap"
            >
              <span
                data-experience-bar-label
                className="text-card-xp-label font-bold leading-none text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.6)]"
              >
                {t("experienceBarLabel")}
              </span>
              <ExperienceSegments experience={character.experience} />
              <span
                data-experience-bar-caption
                className="text-card-xp-caption font-bold italic leading-none text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.6)]"
              >
                {experienceCaption.progressKind === "maxLevel"
                  ? t("experienceBarMaxLevel")
                  : t("experienceToNextLevel", {
                      experienceRemaining:
                        experienceCaption.experienceRemaining,
                      nextLevel: experienceCaption.nextLevel,
                    })}
              </span>
            </div>
          )}
          {shownArmour > 0 && (
            // A broken shield keeps showing the armour it had for its beat
            // while it shakes away (globals.css); keyed by beat so the
            // animation replays.
            <div
              key={
                armourBeat
                  ? `${armourBeat.armourBeatKind}-${armourBeat.beatKey}`
                  : "steady"
              }
              data-character-armour={shownArmour}
              data-armour-beat={armourBeat?.armourBeatKind ?? "none"}
              role="img"
              aria-label={t("armourLabel", { armour: shownArmour })}
              className="absolute right-card-armour-inset top-card-armour-inset flex size-card-armour-badge items-center justify-center"
            >
              <Shield
                aria-hidden="true"
                className="absolute inset-0 size-full fill-(--color-iron-700) text-(--color-parchment-50)"
              />
              <span className="relative text-card-armour font-bold leading-none text-(--color-parchment-50)">
                {shownArmour}
              </span>
            </div>
          )}
          <div
            className={`absolute inset-0 flex items-center justify-center bg-black/50 text-card-overlay font-bold tracking-wide text-white uppercase transition-opacity duration-200 ease-out ${
              isDowned ? "opacity-100" : "opacity-0"
            }`}
          >
            {t("downed")}
          </div>
        </div>

        {showInlineExperienceBar && (
          // Always visible (shop cards); unlike the overlay bar, it has no
          // reveal rules and no wash.
          <div
            data-character-inline-experience-bar
            aria-hidden="true"
            className="mx-card-inset shrink-0"
          >
            <ExperienceSegments experience={character.experience} />
          </div>
        )}

        <div
          className={`justify-start text-card-label font-medium ${PANEL_BAR_CLASS_NAME}`}
          style={{
            background: "var(--texture-card-panel)",
            boxShadow: "var(--shadow-stat-pill)",
          }}
        >
          {characterClassIds.map((characterClassId, characterClassIndex) => (
            <span
              key={characterClassId}
              className="flex items-center gap-card-label-gap"
            >
              {characterClassIndex > 0 && <span aria-hidden="true">·</span>}
              <span data-character-class-id={characterClassId}>
                {tCharacterClass(characterClassId)}
              </span>
            </span>
          ))}
        </div>

        <div
          data-character-card-bottom-row
          className="mx-card-inset flex shrink-0 items-center justify-between"
        >
          {showLevel && (
            // Deliberately distinct from the iron stats pill, and labelled
            // "Lv" so it never reads as the Roman-numeral tier.
            <span
              data-character-level={level}
              className={`flex overflow-hidden rounded-card-pill text-card-stat font-bold leading-none ${DARK_TEXT_CLASS_NAME}`}
              style={{ boxShadow: "var(--shadow-stat-pill)" }}
            >
              <span
                className="flex items-center gap-card-pill-gap px-card-pill-x py-card-pill-y"
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom, var(--color-parchment-50), var(--color-parchment-300))",
                }}
              >
                {t("levelPill", { level })}
              </span>
            </span>
          )}

          <div
            className="ml-auto flex overflow-hidden rounded-card-pill text-card-stat font-bold leading-none"
            style={{ boxShadow: "var(--shadow-stat-pill)" }}
          >
            <span
              data-character-stat="attack"
              data-character-stat-value={String(character.attack)}
              className="flex items-center gap-card-pill-gap px-card-pill-x py-card-pill-y"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, var(--color-iron-300), var(--color-iron-700))",
              }}
            >
              <span aria-hidden="true" className="text-(--color-parchment-50)">
                ⚔
              </span>
              <span className="text-(--color-parchment-50)">
                {character.attack}
              </span>
            </span>
            <span
              data-character-stat="hp"
              data-character-stat-value={String(character.hp)}
              data-hp-display-tone={hpTone}
              className="flex items-center gap-card-pill-gap border-l border-(--color-iron-900) px-card-pill-x py-card-pill-y"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, var(--color-iron-300), var(--color-iron-700))",
              }}
            >
              <span aria-hidden="true" className="text-(--color-heart-red-400)">
                ❤
              </span>
              <span className={HP_TONE_TEXT_CLASS_NAME[hpTone]}>
                {character.hp}
              </span>
            </span>
          </div>
        </div>

        {(showExperienceBar || showRevealWash) && (
          // The wash (z-1) and the bar (z-2, above) share the card root's
          // stacking context. This works only because the portrait
          // container creates no stacking context of its own — adding a
          // z-index, transform, opacity, filter or isolation to the
          // portrait container would trap the bar beneath the wash.
          // globals.css owns the wash's colour and reveal visibility, so
          // no background or opacity classes are given here. The shop
          // (Phase 12) uses this same wash without the XP bar
          // (showRevealWash), to match the camp roster's hover feedback.
          <div
            data-character-experience-mask
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-1 rounded-md"
          />
        )}
      </div>
    </div>
  );
}
