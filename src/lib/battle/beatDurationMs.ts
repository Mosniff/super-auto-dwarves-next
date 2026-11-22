import type { BeatType } from "./types";

// Placeholder pacing — the human tunes these by eye later. Nothing may
// exceed DROP_BEAT_DURATION_MS: the fixed-step autoplay integration tests
// step their fake timer by that ceiling so a single tick still clears one
// beat, whichever beat type it is.
export const EVENTFUL_BEAT_DURATION_MS = 800;
export const QUIET_BEAT_DURATION_MS = 400;
// DROP beats carry the most choreography (roster launch, delayed active
// entrance, dying card's poof, pile arrival), so they get the longest dwell.
export const DROP_BEAT_DURATION_MS = 1100;
// The opening "prepare" beat (BATTLE_START): the gaps close. The fronts
// launch on the engage beat instead; the human tunes both.
export const PREPARE_BEAT_DURATION_MS = 800;
// The engage beat (ENGAGE): the fronts launch into the action zone
// (presentation in step 11b).
export const ENGAGE_BEAT_DURATION_MS = 900;
// A turn-start ability's beat (Phase 13, Yip!): one per actor every turn,
// so it is kept short — the human's call, ~300 ms.
export const TURN_START_ABILITY_BEAT_DURATION_MS = 300;

// Autoplay's Slow speed (Phase 14): every beat's wait is multiplied by this
// one constant. It stretches only the pause between beats; each beat's
// animations keep their own timings and simply finish earlier. Tune freely.
export const SLOW_AUTOPLAY_BEAT_DURATION_MULTIPLIER = 2;

export function autoplayBeatDelayMs(
  beatType: BeatType | undefined,
  autoplaySpeed: "slow" | "fast",
): number {
  return (
    beatDurationMs(beatType) *
    (autoplaySpeed === "slow" ? SLOW_AUTOPLAY_BEAT_DURATION_MULTIPLIER : 1)
  );
}

export function beatDurationMs(beatType: BeatType | undefined): number {
  if (beatType === "DROP") {
    return DROP_BEAT_DURATION_MS;
  }

  // A battle-start ability's beat: its battle cry and its effects landing.
  if (beatType === "CLASH" || beatType === "ABILITY") {
    return EVENTFUL_BEAT_DURATION_MS;
  }

  if (beatType === "BATTLE_START") {
    return PREPARE_BEAT_DURATION_MS;
  }

  if (beatType === "ENGAGE") {
    return ENGAGE_BEAT_DURATION_MS;
  }

  if (beatType === "TURN_START_ABILITY") {
    return TURN_START_ABILITY_BEAT_DURATION_MS;
  }

  return QUIET_BEAT_DURATION_MS;
}

// Which caster pulse a beat plays (Phase 13): a turn-start ability's beat
// is too short for the normal pulse (--ability-caster-duration), so it
// plays the quick one (--ability-caster-quick-duration in globals.css,
// which must not exceed TURN_START_ABILITY_BEAT_DURATION_MS).
export type AbilityCasterPulseKind = "normal" | "quick";

export function abilityCasterPulseKind(
  beatType: BeatType | undefined,
): AbilityCasterPulseKind {
  return beatType === "TURN_START_ABILITY" ? "quick" : "normal";
}
