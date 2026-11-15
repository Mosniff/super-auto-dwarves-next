import { levelFromExperience, type CharacterLevel } from "@/lib/game/characterExperience";
import type { CampIntent } from "./campSelection";

export type RosterSlotExitKind = "shuffle" | "mergedAway" | "sold";

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
