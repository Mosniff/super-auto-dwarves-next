// Display-only timing for the start-of-camp ability sequence (Phase 12).
// The human tunes these.
export const CAMP_START_SEQUENCE_START_DELAY_MS = 550; // after the 0.35s phase swipe
export const CAMP_START_STEP_MS = 900; // one activation's beat
export const CAMP_START_LAND_DELAY_MS = 300; // gold lands after the card activates (as battle's receive delay)
export const CAMP_START_FLOATER_DURATION_MS = 1200; // the last floater's rise; the lock lasts until it ends

export type CampStartTimelineEvent =
  | { atMs: number; timelineEventKind: "activate" | "land"; activationIndex: number }
  | { atMs: number; timelineEventKind: "finish" };

export function campStartSequenceTimeline(
  activationCount: number,
): CampStartTimelineEvent[] {
  const timeline: CampStartTimelineEvent[] = [];
  let lastLandAtMs: number | null = null;

  for (
    let activationIndex = 0;
    activationIndex < activationCount;
    activationIndex += 1
  ) {
    const activateAtMs =
      CAMP_START_SEQUENCE_START_DELAY_MS + activationIndex * CAMP_START_STEP_MS;
    const landAtMs = activateAtMs + CAMP_START_LAND_DELAY_MS;

    timeline.push({ atMs: activateAtMs, timelineEventKind: "activate", activationIndex });
    timeline.push({ atMs: landAtMs, timelineEventKind: "land", activationIndex });

    lastLandAtMs = landAtMs;
  }

  if (lastLandAtMs !== null) {
    timeline.push({
      atMs: lastLandAtMs + CAMP_START_FLOATER_DURATION_MS,
      timelineEventKind: "finish",
    });
  }

  return timeline;
}

export function pendingCampStartGold(
  goldGainedByActivation: readonly number[],
  landedActivationCount: number,
): number {
  return goldGainedByActivation
    .slice(landedActivationCount)
    .reduce((total, goldGained) => total + goldGained, 0);
}
