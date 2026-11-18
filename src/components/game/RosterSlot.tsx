"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type TargetAndTransition,
} from "motion/react";
import { useTranslations } from "next-intl";
import type { Character } from "@/lib/game/character";
import { CHARACTER_SELL_PRICE } from "@/lib/game/shop";
import type { BeatCharacterEffect } from "@/lib/battle/beatCharacterEffects";
import {
  abilityHpGainFromRefresh,
  experienceGainBeat,
  type RosterSlotExitKind,
} from "./rosterSlotAnimation";
import type { CampStartSlotBeat } from "./campStartSequence";
import { CharacterCard } from "./CharacterCard";
import { armourBeatFromEffect, BattleBeatFloaters } from "./BattleBeatFloaters";

interface RosterSlotProps {
  character?: Character;
  facing?: "left" | "right";
  isNext?: boolean;
  showsCharacterProgression?: boolean;
  // Display-only: how this slot's departing card should exit; defaults to
  // today's plain slide. Used only for the data attribute when no
  // interaction wiring supplies it (the plain, non-interactive path).
  exitKind?: RosterSlotExitKind;
  // Display-only, used only for the data-roster-slot-index attribute.
  slotIndex?: number;
  // Phase 12 battle beat animations: what this beat did to this slot's
  // character, if anything, and the beat it belongs to (for re-keying).
  beatEffect?: BeatCharacterEffect;
  beatKey?: number;
  // Phase 12 start-of-camp sequence: display-only.
  campStartBeat?: CampStartSlotBeat;
}

const SHUFFLE_EXIT_DURATION_S = 0.3;
const SHUFFLE_ENTER_DELAY_S = 0.15;
const SHUFFLE_ENTER_DURATION_S = 0.3;

// Grandiose promotion-exit — only the FRONT (on-deck) slot's outgoing card
// uses these, when it's promoted into the active zone.
const LAUNCH_TOTAL_DURATION_S = 0.5;
const LAUNCH_WINDUP_SCALE = 1.2;
const LAUNCH_SHAKE_DEGREES = 3;
const LAUNCH_BRIGHTNESS = 1.35; // brightness pulse peak during wind-up
const LAUNCH_EXIT_X = "400%"; // well past the slot's clip boundary

// "Absorbed in place" — a merged-away card brightens, shrinks and fades.
const MERGED_AWAY_EXIT_SCALE = 0.6;
const MERGED_AWAY_EXIT_DURATION_S = 0.35;
const MERGED_AWAY_EXIT_BRIGHTNESS = 1.6;

// A sold card sinks and fades.
const SOLD_EXIT_DROP_Y = "30%";
const SOLD_EXIT_DURATION_S = 0.35;

// The XP beat's motion (pulse + brightness, amber-ring glow, level-pill
// pop) lives in globals.css, driven by the data-experience-beat attribute
// below — not here. Only the floater's delay is still needed in JS; it
// must match --experience-beat-delay in globals.css.
const EXPERIENCE_BEAT_DELAY_S = 0.35;

// Rise-and-fade floaters ("+N gold", "+N XP", "Level up!").
const FLOATER_RISE_Y = -40;
const FLOATER_DURATION_S = 1.2;

// Shortly after the XP floater (the ruling); the human tunes it.
const ABILITY_HP_FLOATER_DELAY_S = EXPERIENCE_BEAT_DELAY_S + 0.5;

export function RosterSlot({
  character,
  facing = "right",
  isNext = false,
  showsCharacterProgression = false,
  exitKind = "shuffle",
  slotIndex,
  beatEffect,
  beatKey,
  campStartBeat,
}: RosterSlotProps) {
  const prefersReducedMotion = useReducedMotion();
  const showNextHalo = isNext && Boolean(character);
  const t = useTranslations("common");
  // Only the front slot's exit is the grandiose wind-up + launch; every other
  // slot keeps the plain slide. Reduced motion overrides this to an instant
  // pin, same as the plain exit.
  const shouldUseGrandioseExit = isNext && !prefersReducedMotion;

  // While true, the recess renders WITHOUT overflow-hidden so the front
  // slot's launching card can fly clear of the slot boundary instead of
  // being clipped at its edge. Set when this front slot's occupant just
  // changed away (its old card is beginning its grandiose exit); cleared by
  // AnimatePresence.onExitComplete once that exit animation actually
  // finishes, so it can never desync from the real animation length.
  const [isLaunchingCardOut, setIsLaunchingCardOut] = useState(false);
  const previousCharacterIdRef = useRef(character?.id);

  // "+N gold" floater, shown when this slot's occupant was just sold.
  const [goldFloaterSequence, setGoldFloaterSequence] = useState(0);

  useEffect(() => {
    const previousCharacterId = previousCharacterIdRef.current;
    const occupantChangedAway =
      previousCharacterId !== undefined &&
      previousCharacterId !== character?.id;

    if (isNext && !prefersReducedMotion && occupantChangedAway) {
      setIsLaunchingCardOut(true);
    }

    if (occupantChangedAway && exitKind === "sold" && !prefersReducedMotion) {
      setGoldFloaterSequence((sequence) => sequence + 1);
    }

    previousCharacterIdRef.current = character?.id;
  }, [character?.id, isNext, prefersReducedMotion, exitKind]);

  // The XP beat: played on the SAME card instance (never on a remount) when
  // its experience rises across a refresh. This effect only sets state —
  // it calls nothing imperative. The beat's motion (pulse + brightness,
  // amber-ring glow, level-pill pop) is CSS, driven by the
  // data-experience-beat attribute below; this removed a ref-dependent
  // useAnimate() call that crashed in the browser with a null scope (the
  // investigation couldn't prove why — dev Strict Mode only simulates
  // remounts on a first mount, and this target was already mounted — so
  // rather than depend on a ref whose null-ness is unexplained, the beat
  // became state with CSS motion, like the existing XP-bar reveal).
  const previousProgressRef = useRef<{
    characterId: string;
    experience: number;
    maxHp: number;
  } | null>(null);
  const [experienceBeatSequence, setExperienceBeatSequence] = useState(0);
  const [activeExperienceBeat, setActiveExperienceBeat] = useState<ReturnType<
    typeof experienceGainBeat
  > | null>(null);
  const [isExperienceBeatActive, setIsExperienceBeatActive] = useState(false);
  // Separate from activeExperienceBeat so it isn't cleared when the XP
  // floater's onAnimationComplete clears that state.
  const [abilityHpFloater, setAbilityHpFloater] = useState<{
    sequence: number;
    hpGained: number;
  } | null>(null);

  useEffect(() => {
    if (!character) {
      previousProgressRef.current = null;
      return;
    }

    const previousProgress = previousProgressRef.current;

    if (
      showsCharacterProgression &&
      !prefersReducedMotion &&
      previousProgress !== null &&
      previousProgress.characterId === character.id
    ) {
      const beat = experienceGainBeat(
        previousProgress.experience,
        character.experience,
      );

      if (beat.beatKind !== "none") {
        setExperienceBeatSequence((sequence) => sequence + 1);
        setActiveExperienceBeat(beat);
        setIsExperienceBeatActive(true);

        const abilityHpGained = abilityHpGainFromRefresh(
          previousProgress,
          character,
        );

        if (abilityHpGained > 0) {
          setAbilityHpFloater((floater) => ({
            sequence: (floater?.sequence ?? 0) + 1,
            hpGained: abilityHpGained,
          }));
        }
      }
    }

    previousProgressRef.current = {
      characterId: character.id,
      experience: character.experience,
      maxHp: character.maxHp,
    };
  }, [character?.id, character?.experience, character?.maxHp]);

  // Player slabs are facing="right" (front of the reversed row is at screen
  // right); enemy slabs are facing="left" (front of the normal row is at
  // screen left). Cards exit toward the front and enter from the back —
  // derived from the existing `facing` prop rather than threading a new one.
  const cardExitX = facing === "right" ? "100%" : "-100%";
  const cardEnterInitialX = facing === "right" ? "-100%" : "100%";
  // Same direction convention as cardExitX, just with the launch's much
  // larger travel distance.
  const launchExitX = facing === "right" ? LAUNCH_EXIT_X : `-${LAUNCH_EXIT_X}`;

  // AnimatePresence's custom gives the leaving card the exit kind of the
  // refresh that removed it: by the time a card's exit actually plays, a
  // later render may already describe a different occupant (and a
  // different exitKind for ITS eventual exit), so the exit variant must
  // receive the value that was current when this card was removed, not
  // whatever the prop reads at animation time. The grandiose launch exit
  // (the front slot's promotion) always takes priority over any exitKind,
  // unchanged from before this file learned about exitKind at all.
  const cardExitVariants = {
    exit: (exitKindAtExit: RosterSlotExitKind): TargetAndTransition => {
      if (prefersReducedMotion) {
        return { x: "0%", transition: { duration: 0 } };
      }

      if (shouldUseGrandioseExit) {
        return {
          // Wind-up (t 0 -> 0.5): x holds at "0%" (identical start/mid
          // keyframe = no movement) while scale, filter, and rotate do
          // their thing. Launch (t 0.5 -> 1): x whips out to launchExitX
          // on a sharp easeIn, while scale/filter/rotate settle back to
          // their resting values.
          x: ["0%", "0%", launchExitX],
          scale: [1, LAUNCH_WINDUP_SCALE, 1],
          filter: [
            "brightness(1)",
            `brightness(${LAUNCH_BRIGHTNESS})`,
            "brightness(1)",
          ],
          // Four small back-and-forth tilts, all within the wind-up half;
          // already back at 0 by t=0.5, and stays there through the
          // launch.
          rotate: [
            0,
            LAUNCH_SHAKE_DEGREES,
            -LAUNCH_SHAKE_DEGREES,
            LAUNCH_SHAKE_DEGREES,
            -LAUNCH_SHAKE_DEGREES,
            0,
            0,
          ],
          transition: {
            duration: LAUNCH_TOTAL_DURATION_S,
            x: {
              duration: LAUNCH_TOTAL_DURATION_S,
              times: [0, 0.5, 1],
              ease: "easeIn",
            },
            scale: {
              duration: LAUNCH_TOTAL_DURATION_S,
              times: [0, 0.5, 1],
              ease: "easeInOut",
            },
            filter: {
              duration: LAUNCH_TOTAL_DURATION_S,
              times: [0, 0.5, 1],
              ease: "easeInOut",
            },
            rotate: {
              duration: LAUNCH_TOTAL_DURATION_S,
              times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 1],
              ease: "easeInOut",
            },
          },
        };
      }

      if (exitKindAtExit === "mergedAway") {
        return {
          scale: MERGED_AWAY_EXIT_SCALE,
          opacity: 0,
          filter: `brightness(${MERGED_AWAY_EXIT_BRIGHTNESS})`,
          transition: {
            duration: MERGED_AWAY_EXIT_DURATION_S,
            ease: "easeIn",
          },
        };
      }

      if (exitKindAtExit === "sold") {
        return {
          y: SOLD_EXIT_DROP_Y,
          opacity: 0,
          transition: { duration: SOLD_EXIT_DURATION_S, ease: "easeIn" },
        };
      }

      return {
        x: cardExitX,
        transition: {
          duration: SHUFFLE_EXIT_DURATION_S,
          ease: "easeIn",
        },
      };
    },
  };

  const rosterSlotIndexAttributes =
    slotIndex === undefined ? {} : { "data-roster-slot-index": slotIndex };

  // The beat is state, exposed as a data attribute; its motion lives in
  // globals.css (CLAUDE.md -> "Internationalization" pattern of state here,
  // presentation there — mirrored for CSS instead of translation). A
  // second beat on the same dwarf while one is still running doesn't
  // restart the CSS animation (the attribute would read the same string
  // twice in a row), but its floater still shows — an accepted trade-off.
  const experienceBeatAttribute =
    isExperienceBeatActive && activeExperienceBeat
      ? activeExperienceBeat.beatKind
      : "none";

  return (
    <div
      className="relative"
      data-roster-slot
      data-roster-slot-exit-kind={exitKind}
      data-experience-beat-active={String(isExperienceBeatActive)}
      data-experience-beat={experienceBeatAttribute}
      data-ability-acting={
        beatEffect?.isActing || campStartBeat?.isActing ? "true" : "false"
      }
      {...rosterSlotIndexAttributes}
    >
      <div
        className={`relative flex aspect-3/4 flex-col items-center justify-center gap-1 rounded-md bg-slate-200 p-1.5 ${
          isLaunchingCardOut ? "overflow-visible" : "overflow-hidden"
        }`}
        style={{ boxShadow: "var(--shadow-recess)" }}
      >
        {/* Only the CharacterCard animates — the recess and its padding
            never move. The outgoing/incoming cards are absolutely
            positioned within this (already relative) recess so they overlap
            in place rather than reflowing the recess's own flex-col layout
            while both are briefly mounted. inset-0 (not the recess's p-1.5)
            so the card fills the full interior edge-to-edge, hiding the
            shaded recess entirely when occupied; overflow-hidden +
            rounded-md on the recess clips it to the same rounded corners —
            except during the front slot's launch (isLaunchingCardOut), when
            overflow is briefly lifted so the card can fly clear. The card
            wrapper itself also carries its own overflow-hidden rounded-md
            (matching the recess's), so it already looks rounded on its own
            terms when the recess's clip lifts — no corner "pop". */}
        {/* initial={false}: a card already present when the slot mounts
            appears in place, with no slide-in; only a card added later
            animates its entrance. */}
        <AnimatePresence
          initial={false}
          custom={exitKind}
          onExitComplete={() => setIsLaunchingCardOut(false)}
        >
          {character && (
            <motion.div
              key={character.id}
              className="absolute inset-0 overflow-hidden rounded-md"
              custom={exitKind}
              variants={cardExitVariants}
              initial={prefersReducedMotion ? false : { x: cardEnterInitialX }}
              animate={{ x: "0%" }}
              exit="exit"
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : {
                      delay: SHUFFLE_ENTER_DELAY_S,
                      duration: SHUFFLE_ENTER_DURATION_S,
                      ease: "easeOut",
                    }
              }
            >
              <div
                data-roster-slot-beat-target
                className="relative h-full w-full"
              >
                <CharacterCard
                  character={character}
                  facing={facing}
                  showLevel={showsCharacterProgression}
                  showExperienceBar={showsCharacterProgression}
                  armourBeat={armourBeatFromEffect(beatEffect, beatKey)}
                />
                {/* The recess clips outer glows, so the glow is inset. At
                    opacity 0 except during the CSS-driven XP-beat
                    animation (globals.css, keyed on data-experience-beat). */}
                <span
                  data-roster-slot-xp-ring
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-md opacity-0"
                  style={{
                    boxShadow: "inset 0 0 0 3px rgba(251,191,36,0.9)",
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!character && (
          <span className="select-none text-[20px] font-medium uppercase tracking-wide text-parchment-50/30">
            {t("empty")}
          </span>
        )}
      </div>
      {showNextHalo && (
        <div
          data-roster-slot-on-deck-halo
          className="pointer-events-none absolute -inset-2 rounded-lg border-2"
          style={{ borderColor: "var(--color-parchment-300)" }}
        >
          <span
            className="absolute left-1/2 -bottom-1.75 -translate-x-1/2 rounded-full px-1.5 py-0 text-[8px] font-bold tracking-wide uppercase"
            style={{
              backgroundColor: "var(--color-slate-300)",
              color: "var(--color-parchment-300)",
            }}
          >
            {t("next")}
          </span>
        </div>
      )}
      {/* Floaters render outside the recess so its overflow-hidden never
          clips them. */}
      {goldFloaterSequence > 0 && (
        <motion.span
          key={`gold-${goldFloaterSequence}`}
          data-roster-slot-floater="gold"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/3 z-20 text-center text-lg font-bold text-(--color-parchment-50) [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]"
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [0, FLOATER_RISE_Y], opacity: [0, 1, 1, 0] }}
          transition={{ duration: FLOATER_DURATION_S }}
          onAnimationComplete={() => setGoldFloaterSequence(0)}
        >
          {t("sellGoldFloater", { gold: CHARACTER_SELL_PRICE })}
        </motion.span>
      )}
      {activeExperienceBeat && activeExperienceBeat.beatKind !== "none" && (
        <motion.span
          key={`experience-${experienceBeatSequence}`}
          data-roster-slot-floater="experience"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/3 z-20 text-center text-lg font-bold text-(--color-parchment-50) [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]"
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [0, FLOATER_RISE_Y], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: FLOATER_DURATION_S,
            delay: EXPERIENCE_BEAT_DELAY_S,
          }}
          onAnimationComplete={() => {
            setActiveExperienceBeat(null);
            setIsExperienceBeatActive(false);
          }}
        >
          {activeExperienceBeat.beatKind === "levelledUp"
            ? t("levelUpFloater")
            : t("experienceGainFloater", {
                experienceGained: activeExperienceBeat.experienceGained,
              })}
        </motion.span>
      )}
      {abilityHpFloater && (
        <motion.span
          key={`ability-hp-${abilityHpFloater.sequence}`}
          data-roster-slot-floater="abilityHp"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 z-20 text-center text-lg font-bold text-emerald-300 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]"
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [0, FLOATER_RISE_Y], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: FLOATER_DURATION_S,
            delay: ABILITY_HP_FLOATER_DELAY_S,
          }}
          onAnimationComplete={() => setAbilityHpFloater(null)}
        >
          {t("abilityHpFloater", { hp: abilityHpFloater.hpGained })}
        </motion.span>
      )}
      {campStartBeat && campStartBeat.landedGold !== null && (
        <motion.span
          key="camp-start-gold"
          data-roster-slot-floater="abilityGold"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/3 z-20 text-center text-lg font-bold text-amber-300 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]"
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [0, FLOATER_RISE_Y], opacity: [0, 1, 1, 0] }}
          transition={{ duration: FLOATER_DURATION_S }}
        >
          {t("abilityGoldFloater", { gold: campStartBeat.landedGold })}
        </motion.span>
      )}
      <BattleBeatFloaters beatEffect={beatEffect} beatKey={beatKey} />
    </div>
  );
}
