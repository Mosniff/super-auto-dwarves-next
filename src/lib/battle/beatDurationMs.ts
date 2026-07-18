import type { BeatType } from "./types";

// Placeholder pacing — the human tunes these by eye later. Kept <= 800ms so
// the fixed-step autoplay integration test still clears one beat per tick.
export const EVENTFUL_BEAT_DURATION_MS = 800;
export const QUIET_BEAT_DURATION_MS = 400;

function isEventfulBeatType(beatType: BeatType): boolean {
  return beatType === "CLASH" || beatType === "DROP";
}

export function beatDurationMs(beatType: BeatType | undefined): number {
  return beatType !== undefined && isEventfulBeatType(beatType)
    ? EVENTFUL_BEAT_DURATION_MS
    : QUIET_BEAT_DURATION_MS;
}
