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
import { animationTempoSeconds } from "@/lib/animationTempo";
import {
  abilityCasterMotionKind,
  type BeatCharacterEffect,
} from "@/lib/battle/beatCharacterEffects";
import type { AbilityCasterPulseKind } from "@/lib/battle/beatDurationMs";
import {
  abilityHpGainFromRefresh,
  armourStruckBeat,
  experienceGainBeat,
  rosterSlotEffectFlashKind,
  rosterSlotExitAnimation,
  type RosterSlotExitKind,
} from "./rosterSlotAnimation";
import type { CampStartSlotBeat } from "./campStartSequence";
import { CharacterCard } from "./CharacterCard";
import { armourBeatFromEffect, BattleBeatFloaters } from "./BattleBeatFloaters";
import { downedRevealDelaySeconds } from "./floatersForBeat";

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
  // Phase 13, display-only: the characters that dropped in this battle
  // beat, so a card leaving because it dropped plays the drop.
  droppedCharacterIds?: ReadonlySet<string>;
  // Phase 13, display-only: a turn-start ability's beat plays the quick
  // caster pulse (see abilityCasterPulseKind).
  abilityCasterPulse?: AbilityCasterPulseKind;
}

// What a leaving card's exit variant receives (AnimatePresence's custom).
interface RosterSlotExitCustom {
  exitKind: RosterSlotExitKind;
  droppedCharacterIds: ReadonlySet<string>;
}

const NO_DROPPED_CHARACTER_IDS: ReadonlySet<string> = new Set();

// The in-place poof of a dropped card (Phase 13), matching ActiveCard's
// front-card dissolve.
const DROPPED_EXIT_SCALE = 1.13;
const DROPPED_EXIT_DURATION_S = animationTempoSeconds(0.4);

const SHUFFLE_EXIT_DURATION_S = animationTempoSeconds(0.3);
const SHUFFLE_ENTER_DELAY_S = animationTempoSeconds(0.15);
const SHUFFLE_ENTER_DURATION_S = animationTempoSeconds(0.3);

// Grandiose promotion-exit — only the FRONT (on-deck) slot's outgoing card
// uses these, when it's promoted into the active zone.
const LAUNCH_TOTAL_DURATION_S = animationTempoSeconds(0.5);
const LAUNCH_WINDUP_SCALE = 1.26;
const LAUNCH_SHAKE_DEGREES = 3;
const LAUNCH_BRIGHTNESS = 1.35; // brightness pulse peak during wind-up
const LAUNCH_EXIT_X = "400%"; // well past the slot's clip boundary

// "Absorbed in place" — a merged-away card brightens, shrinks and fades.
const MERGED_AWAY_EXIT_SCALE = 0.6;
const MERGED_AWAY_EXIT_DURATION_S = animationTempoSeconds(0.35);
const MERGED_AWAY_EXIT_BRIGHTNESS = 1.6;

// A sold card sinks and fades.
const SOLD_EXIT_DROP_Y = "30%";
const SOLD_EXIT_DURATION_S = animationTempoSeconds(0.35);

// The XP beat's motion (pulse + brightness, amber-ring glow, level-pill
// pop) lives in globals.css, driven by the data-experience-beat attribute
// below — not here. Only the floater's delay is still needed in JS; it
// must match --experience-beat-delay in globals.css.
const EXPERIENCE_BEAT_DELAY_S = animationTempoSeconds(0.35);

// Rise-and-fade floaters ("+N gold", "+N XP", "Level up!").
const FLOATER_RISE_Y = -52;
const FLOATER_DURATION_S = animationTempoSeconds(1.2);

// The XP beat ends when its floater would: delay + rise-and-fade.
const EXPERIENCE_BEAT_LIFETIME_MS =
  (EXPERIENCE_BEAT_DELAY_S + FLOATER_DURATION_S) * 1000;

// Shortly after the XP floater (the ruling); the human tunes it.
const ABILITY_HP_FLOATER_DELAY_S =
  EXPERIENCE_BEAT_DELAY_S + animationTempoSeconds(0.5);

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
  droppedCharacterIds = NO_DROPPED_CHARACTER_IDS,
  abilityCasterPulse = "normal",
}: RosterSlotProps) {
  const prefersReducedMotion = useReducedMotion();
  const showsOnDeckMarker = isNext && Boolean(character);
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
  // beat's timer clears that state.
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately narrow: the XP beat fires only when this card's id, experience or maxHp change, reading the latest character and settings at that moment; adding them would re-run it on every refresh.
  }, [character?.id, character?.experience, character?.maxHp]);

  // The XP beat's lifetime is owned by this timer, not by the floater's
  // motion onAnimationComplete: that callback can fail to arrive (the stuck
  // hover after a merge-buy, Phase 13 step 0), which left the beat — and
  // the revealed XP bar — on for good. A new beat (sequence bump) clears
  // the old timer and starts a fresh one.
  useEffect(() => {
    if (!isExperienceBeatActive) {
      return;
    }

    const experienceBeatEndTimeout = setTimeout(() => {
      setActiveExperienceBeat(null);
      setIsExperienceBeatActive(false);
    }, EXPERIENCE_BEAT_LIFETIME_MS);

    return () => clearTimeout(experienceBeatEndTimeout);
  }, [experienceBeatSequence, isExperienceBeatActive]);

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
  // whatever the prop reads at animation time. A dropped card's poof comes
  // first (Phase 13); then the grandiose launch (the front slot's
  // promotion) takes priority over any exitKind — see
  // rosterSlotExitAnimation. This closure belongs to the leaving card's
  // last render, so departingCharacterId is the card that is leaving.
  const departingCharacterId = character?.id;
  const exitCustom: RosterSlotExitCustom = { exitKind, droppedCharacterIds };
  const cardExitVariants = {
    exit: ({
      exitKind: exitKindAtExit,
      droppedCharacterIds: droppedCharacterIdsAtExit,
    }: RosterSlotExitCustom): TargetAndTransition => {
      if (prefersReducedMotion) {
        return { x: "0%", transition: { duration: 0 } };
      }

      const exitAnimation = rosterSlotExitAnimation({
        exitKind: exitKindAtExit,
        isFrontSlotOnDeck: shouldUseGrandioseExit,
        hasDepartingCharacterDropped:
          departingCharacterId !== undefined &&
          droppedCharacterIdsAtExit.has(departingCharacterId),
      });

      if (exitAnimation === "dropped") {
        return {
          x: "0%",
          opacity: 0,
          scale: DROPPED_EXIT_SCALE,
          transition: { duration: DROPPED_EXIT_DURATION_S, ease: "easeOut" },
        };
      }

      if (exitAnimation === "launch") {
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

      if (exitAnimation === "mergedAway") {
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

      if (exitAnimation === "sold") {
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

  const effectFlashKind = rosterSlotEffectFlashKind(beatEffect);
  const isActing = Boolean(beatEffect?.isActing || campStartBeat?.isActing);
  const isPlayingBeatAnimation = isActing || effectFlashKind !== "none";
  // Camp-start casters support.
  const casterMotionKind =
    beatEffect !== undefined
      ? abilityCasterMotionKind(beatEffect)
      : campStartBeat?.isActing
        ? "support"
        : "none";
  // The parity alternates each beat, so the receive animation's name
  // changes and CSS restarts it (globals.css → "Phase 15 bench receive
  // motion").
  const receiveParity =
    beatKey !== undefined && beatKey % 2 === 1 ? "odd" : "even";
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
      data-ability-acting={String(isActing)}
      data-roster-slot-beat-animating={String(isPlayingBeatAnimation)}
      data-ability-caster-pulse={abilityCasterPulse}
      data-ability-caster-motion={casterMotionKind}
      data-facing={facing}
      {...rosterSlotIndexAttributes}
    >
      <div
        className={`relative flex aspect-3/4 flex-col items-center justify-center gap-1 rounded-md bg-slate-200 p-1.5 ${
          isLaunchingCardOut || isPlayingBeatAnimation
            ? "overflow-visible"
            : "overflow-hidden"
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
            overflow is briefly lifted so the card can fly clear, and while
            the card plays a beat animation (isPlayingBeatAnimation), so it
            can swell, tremble and hop out of the slot (Phase 15). The card
            wrapper no longer clips at all: CharacterCard's own root clips to
            its rounded corners, so the card looks rounded on its own terms
            when the recess's clip lifts — no corner "pop". */}
        {/* initial={false}: a card already present when the slot mounts
            appears in place, with no slide-in; only a card added later
            animates its entrance. */}
        <AnimatePresence
          initial={false}
          custom={exitCustom}
          onExitComplete={() => setIsLaunchingCardOut(false)}
        >
          {character && (
            <motion.div
              key={character.id}
              className="absolute inset-0 rounded-md"
              custom={exitCustom}
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
                {/* The receive layer (Phase 15) carries the hit and buff
                    motion; it is separate from the beat target, which
                    carries the caster pulse, so one card can do both in
                    one beat. */}
                <div
                  data-roster-slot-receive={effectFlashKind}
                  data-roster-slot-receive-parity={receiveParity}
                  className="relative h-full w-full"
                >
                  <CharacterCard
                    character={character}
                    downedRevealDelaySeconds={downedRevealDelaySeconds(
                      beatEffect,
                      abilityCasterPulse,
                    )}
                    showLevel={showsCharacterProgression}
                    showExperienceBar={showsCharacterProgression}
                    armourBeat={
                      armourBeatFromEffect(beatEffect, beatKey) ??
                      armourStruckBeat(beatEffect, beatKey)
                    }
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
                  {/* The hit flash (Phase 15): keyed by the beat so
                      consecutive hits each remount and replay it; colour and
                      motion in globals.css → "Phase 15 bench hit flashes". */}
                  {effectFlashKind !== "none" && beatKey !== undefined && (
                    <span
                      key={`${effectFlashKind}-${beatKey}`}
                      data-roster-slot-effect-flash={effectFlashKind}
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-md opacity-0"
                    />
                  )}
                </div>
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
      {showsOnDeckMarker && (
        <div
          data-roster-slot-on-deck-marker
          data-on-deck-direction={facing}
          className="pointer-events-none"
        >
          <span data-on-deck-chevron aria-hidden="true" />
          <span data-on-deck-label>{t("next")}</span>
        </div>
      )}
      {/* Floaters render outside the recess so its overflow-hidden never
          clips them. */}
      {/* Size, outline, shadow and fill come from globals.css → "Phase 15
          battle floaters" (shared with the camp floaters), keyed on
          data-roster-slot-floater. */}
      {goldFloaterSequence > 0 && (
        <motion.span
          key={`gold-${goldFloaterSequence}`}
          data-roster-slot-floater="gold"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/3 z-20 text-center font-bold"
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
          className="pointer-events-none absolute inset-x-0 top-1/3 z-20 text-center font-bold"
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [0, FLOATER_RISE_Y], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: FLOATER_DURATION_S,
            delay: EXPERIENCE_BEAT_DELAY_S,
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
          className="pointer-events-none absolute inset-x-0 top-1/2 z-20 text-center font-bold"
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
          className="pointer-events-none absolute inset-x-0 top-1/3 z-20 text-center font-bold"
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [0, FLOATER_RISE_Y], opacity: [0, 1, 1, 0] }}
          transition={{ duration: FLOATER_DURATION_S }}
        >
          {t("abilityGoldFloater", { gold: campStartBeat.landedGold })}
        </motion.span>
      )}
      <BattleBeatFloaters
        beatEffect={beatEffect}
        beatKey={beatKey}
        abilityCasterPulse={abilityCasterPulse}
      />
    </div>
  );
}
