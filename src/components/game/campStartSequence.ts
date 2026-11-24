import { animationTempoMs } from "@/lib/animationTempo";
import type { GamePhase } from "@/lib/game/types";
import type { Character } from "@/lib/game/character";
import type { CampRoster } from "@/lib/game/campRoster";
import type { CharacterAbility } from "@/lib/game/characterAbilities";
import { findCharacterAbilityForCharacter } from "@/lib/game/characterAbilityLookup";
import {
  campStartActivations,
  type CampStartActivation,
} from "@/lib/game/campStartAbilities";

// Display-only timing for the start-of-camp ability sequence (Phase 12).
// The human tunes these.
export const CAMP_START_SEQUENCE_START_DELAY_MS = animationTempoMs(550); // after the 0.35s phase swipe
export const CAMP_START_STEP_MS = animationTempoMs(900); // one activation's beat
export const CAMP_START_LAND_DELAY_MS = animationTempoMs(300); // gold lands after the card activates (as battle's receive delay)
export const CAMP_START_FLOATER_DURATION_MS = animationTempoMs(1200); // the last floater's rise; the lock lasts until it ends

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

export interface CampStartSequenceProgress {
  actingActivationIndex: number | null;
  landedActivationCount: number;
  isFinished: boolean;
}

export const CAMP_START_SEQUENCE_NOT_STARTED: CampStartSequenceProgress = {
  actingActivationIndex: null,
  landedActivationCount: 0,
  isFinished: false,
};

export interface CampStartSlotBeat {
  isActing: boolean;
  landedGold: number | null;
}

// Only on arrival from a battle in this session (null on reload, so it
// never replays), and never under reduced motion.
export function campStartActivationsToPlay(
  arrivedFromPhase: GamePhase | null,
  prefersReducedMotion: boolean,
  campRoster: CampRoster,
  findAbility: (
    character: Character,
  ) => CharacterAbility | undefined = findCharacterAbilityForCharacter,
): CampStartActivation[] {
  if (arrivedFromPhase !== "battlePhase" || prefersReducedMotion) {
    return [];
  }

  return campStartActivations(campRoster, findAbility);
}

export function advanceCampStartSequenceProgress(
  progress: CampStartSequenceProgress,
  timelineEvent: CampStartTimelineEvent,
): CampStartSequenceProgress {
  switch (timelineEvent.timelineEventKind) {
    case "activate":
      return { ...progress, actingActivationIndex: timelineEvent.activationIndex };
    case "land":
      return {
        ...progress,
        landedActivationCount: timelineEvent.activationIndex + 1,
      };
    case "finish":
      return { ...progress, actingActivationIndex: null, isFinished: true };
    default: {
      const unreachableTimelineEvent: never = timelineEvent;
      return unreachableTimelineEvent;
    }
  }
}

// A landed slot keeps its gold until the sequence finishes, so the next
// activation never cuts its floater off mid-rise.
export function campStartSlotBeat(
  activations: readonly CampStartActivation[],
  progress: CampStartSequenceProgress,
  slotIndex: number,
): CampStartSlotBeat | undefined {
  if (progress.isFinished) {
    return undefined;
  }

  const activationIndex = activations.findIndex(
    (activation) => activation.slotIndex === slotIndex,
  );
  if (activationIndex === -1) {
    return undefined;
  }

  return {
    isActing: progress.actingActivationIndex === activationIndex,
    landedGold:
      activationIndex < progress.landedActivationCount
        ? activations[activationIndex].goldGained
        : null,
  };
}
