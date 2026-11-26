import {
  BASE_STAT_GAIN_PER_EXPERIENCE_POINT,
  levelFromExperience,
  type CharacterLevel,
} from "@/lib/game/characterExperience";
import type { CampIntent } from "./campSelection";
import type { BeatCharacterEffect } from "@/lib/battle/beatCharacterEffects";
import type { ArmourBeat } from "./CharacterCard";

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
// Phase 16: which end of the row a slot's card slides toward (exit) or in
// from (enter). Slot 0 is the front; RosterSlot maps a side onto the screen
// through its `facing`.
export type RosterSlotShuffleSide = "front" | "back";

export interface RosterSlotShuffleSides {
  exitSide: RosterSlotShuffleSide;
  enterSide: RosterSlotShuffleSide;
}

const DEFAULT_SHUFFLE_SIDES: RosterSlotShuffleSides = {
  exitSide: "front",
  enterSide: "back",
};

// By default a card slides out toward the front and in from the back. A
// camp reposition can go either way, so its two slots slide toward each
// other: the card leaving a slot heads for the other slot, and the card
// arriving comes from it (a move fills the other slot; a swap exchanges
// both cards). Same revision gate as rosterSlotExitKind; display-only.
export function rosterSlotShuffleSides(
  lastSubmittedCampIntent: SubmittedCampIntent | null,
  currentRevision: number,
  slotIndex: number,
): RosterSlotShuffleSides {
  if (
    lastSubmittedCampIntent === null ||
    currentRevision !== lastSubmittedCampIntent.submittedAtRevision + 1
  ) {
    return DEFAULT_SHUFFLE_SIDES;
  }

  const { campIntent } = lastSubmittedCampIntent;

  if (campIntent.intentKind !== "reposition") {
    return DEFAULT_SHUFFLE_SIDES;
  }

  const otherSlotIndex =
    slotIndex === campIntent.fromSlotIndex
      ? campIntent.toSlotIndex
      : slotIndex === campIntent.toSlotIndex
        ? campIntent.fromSlotIndex
        : null;

  if (otherSlotIndex === null) {
    return DEFAULT_SHUFFLE_SIDES;
  }

  const sideOfOtherSlot: RosterSlotShuffleSide =
    otherSlotIndex > slotIndex ? "back" : "front";

  return { exitSide: sideOfOtherSlot, enterSide: sideOfOtherSlot };
}

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

export type RosterSlotEffectFlashKind = "hpHit" | "armourHit" | "buff" | "none";

// A bench card's flash for this beat (Phase 15): hits win over buffs, and
// red wins when one beat does both hits. buff is any beneficial effect
// (today only armour gained; heals and stat buffs join it later).
export function rosterSlotEffectFlashKind(
  beatEffect: BeatCharacterEffect | undefined,
): RosterSlotEffectFlashKind {
  if (beatEffect === undefined) {
    return "none";
  }
  if (beatEffect.hpLost > 0) {
    return "hpHit";
  }
  if (beatEffect.armourLost > 0) {
    return "armourHit";
  }
  if (beatEffect.armourGained > 0) {
    return "buff";
  }
  return "none";
}

// The shield's knock when armour is chipped but not broken (Phase 15).
// Bench-only (the human's call); front cards never get it. A break or a
// gain in the same beat takes precedence.
export function armourStruckBeat(
  beatEffect: BeatCharacterEffect | undefined,
  beatKey: number | undefined,
): ArmourBeat | undefined {
  if (beatEffect === undefined || beatKey === undefined) {
    return undefined;
  }
  if (beatEffect.armourLost === 0) {
    return undefined;
  }
  if (beatEffect.brokenFromArmour !== null || beatEffect.armourGained > 0) {
    return undefined;
  }
  return { armourBeatKind: "struck", beatKey };
}
