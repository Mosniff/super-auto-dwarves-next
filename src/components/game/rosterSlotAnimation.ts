import {
  BASE_STAT_GAIN_PER_EXPERIENCE_POINT,
  levelFromExperience,
  type CharacterLevel,
} from "@/lib/game/characterExperience";
import type { CampIntent } from "./campSelection";

export type RosterSlotExitKind = "shuffle" | "mergedAway" | "sold";

// How a card leaving a slot animates (Phase 13): a drop (the departing
// character dropped this beat — battle-start damage can drop a bench card
// before the engage) always plays the in-place poof, ahead of the front
// slot's launch; otherwise the front slot launches and every other slot
// plays its exit kind.
export type RosterSlotExitAnimation =
  | "dropped"
  | "launch"
  | RosterSlotExitKind;

export function rosterSlotExitAnimation({
  exitKind,
  isFrontSlotOnDeck,
  hasDepartingCharacterDropped,
}: {
  exitKind: RosterSlotExitKind;
  isFrontSlotOnDeck: boolean;
  hasDepartingCharacterDropped: boolean;
}): RosterSlotExitAnimation {
  if (hasDepartingCharacterDropped) {
    return "dropped";
  }

  if (isFrontSlotOnDeck) {
    return "launch";
  }

  return exitKind;
}

export interface SubmittedCampIntent {
  campIntent: CampIntent;
  submittedAtRevision: number;
}

// Each successful save increments the game's revision by exactly 1
// (prismaGameRepository.ts), so only the very next revision is the result
// of this submit — a stale or rejected submit, or an unrelated change,
// falls back to the plain slide. This is display-only; the server never
// learns about it.
export function rosterSlotExitKind(
  lastSubmittedCampIntent: SubmittedCampIntent | null,
  currentRevision: number,
  slotIndex: number,
): RosterSlotExitKind {
  if (
    lastSubmittedCampIntent === null ||
    currentRevision !== lastSubmittedCampIntent.submittedAtRevision + 1
  ) {
    return "shuffle";
  }

  const { campIntent } = lastSubmittedCampIntent;

  if (
    campIntent.intentKind === "mergeCharacters" &&
    campIntent.fromSlotIndex === slotIndex
  ) {
    return "mergedAway";
  }

  if (
    campIntent.intentKind === "sellCharacter" &&
    campIntent.slotIndex === slotIndex
  ) {
    return "sold";
  }

  return "shuffle";
}

export type ExperienceGainBeat =
  | { beatKind: "none" }
  | { beatKind: "experienceGained"; experienceGained: number }
  | { beatKind: "levelledUp"; experienceGained: number; newLevel: CharacterLevel };

// Compares the same dwarf's experience across a refresh, so it covers
// roster merges and merge-buys alike. This is display-only.
export function experienceGainBeat(
  previousExperience: number | undefined,
  currentExperience: number,
): ExperienceGainBeat {
  if (
    previousExperience === undefined ||
    currentExperience <= previousExperience
  ) {
    return { beatKind: "none" };
  }

  const experienceGained = currentExperience - previousExperience;

  if (
    levelFromExperience(currentExperience) >
    levelFromExperience(previousExperience)
  ) {
    return {
      beatKind: "levelledUp",
      experienceGained,
      newLevel: levelFromExperience(currentExperience),
    };
  }

  return { beatKind: "experienceGained", experienceGained };
}

export interface ExperienceAndMaxHp {
  experience: number;
  maxHp: number;
}

// Display-only: the hp an ability added on promotion, derived from the same
// dwarf before and after a refresh. Counted only when XP rose, so max-hp
// changes from any other source never show as an ability floater.
export function abilityHpGainFromRefresh(
  previous: ExperienceAndMaxHp,
  current: ExperienceAndMaxHp,
): number {
  if (current.experience <= previous.experience) {
    return 0;
  }

  const experienceGained = current.experience - previous.experience;
  const abilityHpGained =
    current.maxHp -
    previous.maxHp -
    experienceGained * BASE_STAT_GAIN_PER_EXPERIENCE_POINT;

  return Math.max(abilityHpGained, 0);
}
