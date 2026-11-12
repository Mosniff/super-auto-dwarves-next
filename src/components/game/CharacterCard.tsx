import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Character } from "@/lib/game/character";
import { hpBarFillRatio } from "@/lib/battle/hpBarFillRatio";
import {
  hpDisplayTone,
  tierRomanNumeral,
  type HpDisplayTone,
} from "./characterCardDisplay";

// The layout borrows a trading-card frame structure: a bordered, textured
// body holding a name bar, the portrait, a class bar and an empty text box
// with a stats pill overlapping its corner. Every size inside the frame
// comes from a card-* theme token defined in globals.css, each expressed
// relative to the card's own width (a CSS container query length), so one
// layout serves every card size — a ~100px shop tile and a 288px action
// card alike. The human tunes the numbers there, in one place.

interface CharacterCardProps {
  character: Character;
  facing?: "left" | "right";
  animateHpDrop?: boolean;
  showHpBar?: boolean;
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

export function CharacterCard({
  character,
  facing = "right",
  animateHpDrop = false,
  showHpBar = false,
}: CharacterCardProps) {
  const hpFillRatio = hpBarFillRatio(character.hp, character.maxHp);
  const isDowned = character.hp <= 0;
  const t = useTranslations("common");
  const tCharacterClass = useTranslations("characterClass");
  const tier = character.tier;
  const characterClassIds = character.characterClassIds;
  const hpTone = hpDisplayTone(character.hp, character.maxHp);

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
        className={`flex h-full w-full flex-col gap-card-frame-gap rounded-md border-card-frame p-card-frame-padding ${CARD_FRAME_BORDER_CLASS_NAME}`}
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

        <div className="relative mx-card-inset min-h-0 flex-1 overflow-hidden rounded-card-portrait">
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
          <div
            className={`absolute inset-0 flex items-center justify-center bg-black/50 text-card-overlay font-bold tracking-wide text-white uppercase transition-opacity duration-200 ease-out ${
              isDowned ? "opacity-100" : "opacity-0"
            }`}
          >
            {t("downed")}
          </div>
        </div>

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

        {/* Reserved for abilities, which are unspecified; do not put
            content here. */}
        <div
          data-character-text-box
          className="relative mx-card-inset h-card-text-box-height shrink-0 rounded-card-panel"
          style={{
            background: "var(--texture-card-panel)",
            boxShadow: "var(--shadow-recess)",
          }}
        >
          <div
            className="absolute -right-card-pill-offset -bottom-card-pill-offset flex overflow-hidden rounded-card-pill text-card-stat font-bold leading-none"
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
      </div>
    </div>
  );
}
