"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Character } from "@/lib/game/character";
import { levelFromExperience } from "@/lib/game/characterExperience";
import {
  experienceBarCaption,
  experienceBarSegments,
  hpDisplayTone,
  tierRomanNumeral,
  type HpDisplayTone,
} from "./characterCardDisplay";

// CharacterCard sizes everything in cqw, which draws one design at many
// sizes (a ~100px shop tile and a 288px action card alike). The expanded
// view (CharacterDetailDialog) is essentially one size and a different
// composition, with wings planned for equipment and magic, so it's laid
// out in rem instead. It shares the pure display helpers and the textures
// with CharacterCard, not the markup.
//
// Layout: [left wing] [core] [right wing]. The wings are reserved for
// future equipment and magic panels and aren't rendered yet.

interface ExpandedCharacterCardProps {
  character: Character;
  abilityContent?: ReactNode;
}

const DARK_TEXT_CLASS_NAME = "text-(--color-iron-900)";

const PANEL_BAR_CLASS_NAME = `flex items-center justify-between rounded-lg px-4 py-2 ${DARK_TEXT_CLASS_NAME}`;

const HP_TONE_TEXT_CLASS_NAME: Record<HpDisplayTone, string> = {
  full: "text-(--color-parchment-50)",
  damaged: "text-red-400",
  buffed: "text-emerald-400",
};

export function ExpandedCharacterCard({
  character,
  abilityContent,
}: ExpandedCharacterCardProps) {
  const t = useTranslations("common");
  const tCharacterClass = useTranslations("characterClass");
  const level = levelFromExperience(character.experience);
  const hpTone = hpDisplayTone(character.hp, character.maxHp);
  const { segmentCount, filledSegmentCount, isMaxLevel } =
    experienceBarSegments(character.experience);
  const experienceCaption = experienceBarCaption(character.experience);

  return (
    <div
      data-expanded-character-card
      className="flex items-stretch justify-center gap-(--expanded-card-wing-gap)"
    >
      {/* Left wing (future equipment panel) goes here. */}
      <div
        data-expanded-card-core
        className="flex w-(--expanded-card-width) flex-col gap-3 rounded-xl border-[0.75rem] border-iron-900 p-3 text-(--color-iron-900)"
        style={{ background: "var(--texture-card-frame)" }}
      >
        <div
          className={PANEL_BAR_CLASS_NAME}
          style={{
            background: "var(--texture-card-panel)",
            boxShadow: "var(--shadow-stat-pill)",
          }}
        >
          <span data-expanded-card-name className="text-3xl font-semibold">
            {character.name}
          </span>
          <span data-expanded-card-tier className="text-3xl font-bold">
            {tierRomanNumeral(character.tier)}
          </span>
        </div>

        <div className="flex justify-center">
          <div className="relative aspect-3/4 h-(--expanded-card-portrait-height) overflow-hidden rounded-md">
            <Image
              src="/character_portraits/placeholder.png"
              alt={character.name}
              fill
              className="object-cover"
              sizes="(min-width: 2560px) 26rem, 20rem"
              quality={90}
            />
            {character.armour > 0 && (
              <div
                data-expanded-card-armour={character.armour}
                role="img"
                aria-label={t("armourLabel", { armour: character.armour })}
                className="absolute top-3 right-3 flex size-14 items-center justify-center"
              >
                <Shield
                  aria-hidden="true"
                  className="absolute inset-0 size-full fill-(--color-iron-700) text-(--color-parchment-50)"
                />
                <span className="relative text-2xl font-bold text-(--color-parchment-50)">
                  {character.armour}
                </span>
              </div>
            )}
          </div>
        </div>

        <div
          data-expanded-card-experience
          className="flex flex-col items-center gap-1.5 px-4"
        >
          <span
            data-expanded-card-experience-label
            className="text-base font-bold"
          >
            {t("experienceBarLabel")}
          </span>
          <div aria-hidden="true" className="relative flex h-4 w-full gap-1.5">
            {Array.from({ length: segmentCount }, (_, segmentIndex) => (
              <span
                key={segmentIndex}
                data-expanded-card-experience-segment={
                  segmentIndex < filledSegmentCount ? "filled" : "empty"
                }
                className={`flex-1 rounded-full ${
                  segmentIndex < filledSegmentCount
                    ? "bg-amber-400"
                    : "bg-black/40"
                }`}
              />
            ))}
            {isMaxLevel && (
              <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.6)]">
                {t("experienceBarMax")}
              </span>
            )}
          </div>
          <span
            data-expanded-card-experience-caption
            className="text-base font-bold italic"
          >
            {experienceCaption.progressKind === "maxLevel"
              ? t("experienceBarMaxLevel")
              : t("experienceToNextLevel", {
                  experienceRemaining: experienceCaption.experienceRemaining,
                  nextLevel: experienceCaption.nextLevel,
                })}
          </span>
        </div>

        <div
          className={`gap-3 px-4 py-2 text-xl font-medium ${PANEL_BAR_CLASS_NAME}`}
          style={{
            background: "var(--texture-card-panel)",
            boxShadow: "var(--shadow-stat-pill)",
          }}
        >
          {character.characterClassIds.map((characterClassId, characterClassIndex) => (
            <span key={characterClassId} className="flex items-center gap-2">
              {characterClassIndex > 0 && <span aria-hidden="true">·</span>}
              <span data-expanded-card-class={characterClassId}>
                {tCharacterClass(characterClassId)}
              </span>
            </span>
          ))}
        </div>

        <div data-expanded-card-ability-area className="relative">
          <div
            data-expanded-card-ability-box
            className="min-h-24 rounded-lg px-5 py-4 text-lg text-(--color-iron-900)"
            style={{
              background: "var(--texture-card-panel)",
              boxShadow: "var(--shadow-recess)",
            }}
          >
            {abilityContent}
          </div>
          {/* A sibling of the box, not its child: the tab labels the box,
              and the box's content stays only the ability. Flush with the
              box's top-right corner (no inset), sharing its corner radius
              so it reads as part of the box; the human tunes the look. */}
          {abilityContent && (
            <span
              data-expanded-card-ability-label
              className="absolute top-0 right-0 rounded-tr-lg rounded-bl-lg bg-(--color-iron-700) px-3 py-1 text-sm font-bold uppercase tracking-wide text-(--color-parchment-50)"
            >
              {t("abilityLabel")}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span
            data-expanded-card-level
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xl font-bold ${DARK_TEXT_CLASS_NAME}`}
            style={{
              backgroundImage:
                "linear-gradient(to bottom, var(--color-parchment-50), var(--color-parchment-300))",
            }}
          >
            {t("levelPill", { level })}
          </span>

          <div className="flex overflow-hidden rounded-full text-2xl font-bold">
            <span
              className="flex items-center gap-2 px-3 py-1.5"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, var(--color-iron-300), var(--color-iron-700))",
              }}
            >
              <span aria-hidden="true" className="text-(--color-parchment-50)">
                ⚔
              </span>
              <span data-expanded-card-stat="attack" className="text-(--color-parchment-50)">
                {character.attack}
              </span>
            </span>
            <span
              className="flex items-center gap-2 border-l border-(--color-iron-900) px-3 py-1.5"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, var(--color-iron-300), var(--color-iron-700))",
              }}
            >
              <span aria-hidden="true" className="text-(--color-heart-red-400)">
                ❤
              </span>
              <span
                data-expanded-card-stat="hp"
                data-hp-display-tone={hpTone}
                className={HP_TONE_TEXT_CLASS_NAME[hpTone]}
              >
                {character.hp}
              </span>
            </span>
          </div>
        </div>
      </div>
      {/* Right wing (future magic panel) goes here. */}
    </div>
  );
}
