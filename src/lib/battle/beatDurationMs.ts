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

export function beatDurationMs(beatType: BeatType | undefined): number {
  if (beatType === "DROP") {
    return DROP_BEAT_DURATION_MS;
  }

  if (beatType === "CLASH") {
    return EVENTFUL_BEAT_DURATION_MS;
  }

  return QUIET_BEAT_DURATION_MS;
}
