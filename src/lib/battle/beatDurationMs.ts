import type { BattleEvent } from "./types";

// Placeholder pacing — the human tunes these by eye later. Kept <= 800ms so
// the fixed-step autoplay integration test still clears one beat per tick.
export const EVENTFUL_BEAT_DURATION_MS = 800;
export const QUIET_BEAT_DURATION_MS = 400;

function hasVisibleStateChange(beatEvents: BattleEvent[]): boolean {
  return beatEvents.some(
    (event) => event.type === "DAMAGE" || event.type === "DROP",
  );
}

export function beatDurationMs(beatEvents: BattleEvent[]): number {
  return hasVisibleStateChange(beatEvents)
    ? EVENTFUL_BEAT_DURATION_MS
    : QUIET_BEAT_DURATION_MS;
}
