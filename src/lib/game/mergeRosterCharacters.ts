import { isCampRosterSlotIndex, type CampRoster } from "./campRoster";
import {
  MAX_CHARACTER_LEVEL,
  levelFromExperience,
  mergeCharacterInto,
} from "./characterExperience";

export type MergeRosterCharactersRejectionReason =
  | "invalidSlot"
  | "sameSlot"
  | "sourceSlotEmpty"
  | "targetSlotEmpty"
  | "charactersDoNotMatch"
  | "targetSlotAtMaxLevel";

export type MergeRosterCharactersResult =
  | { outcome: "accepted"; nextCampRoster: CampRoster }
  | {
      outcome: "rejected";
      rejectionReason: MergeRosterCharactersRejectionReason;
    };

// Check order: invalidSlot (either index not an integer in range), then
// sameSlot, then sourceSlotEmpty, then targetSlotEmpty, then
// charactersDoNotMatch, then targetSlotAtMaxLevel. targetSlotAtMaxLevel is
// only ever returned for a matching target, so a preview can read
// "matching" from it (it's returned after charactersDoNotMatch). A
// max-level source is allowed to merge in — the gain simply caps, via
// mergeCharacterInto's existing experience ceiling; only being a *target*
// at max level is rejected. The survivor keeps its slot, id and name:
// the target slot is overwritten with mergeCharacterInto(target, source),
// and the source slot becomes empty.
export function mergeRosterCharacters(
  campRoster: CampRoster,
  fromSlotIndex: number,
  intoSlotIndex: number,
): MergeRosterCharactersResult {
  if (
    !isCampRosterSlotIndex(fromSlotIndex) ||
    !isCampRosterSlotIndex(intoSlotIndex)
  ) {
    return { outcome: "rejected", rejectionReason: "invalidSlot" };
  }

  if (fromSlotIndex === intoSlotIndex) {
    return { outcome: "rejected", rejectionReason: "sameSlot" };
  }

  const sourceCharacter = campRoster[fromSlotIndex];

  if (sourceCharacter === null) {
    return { outcome: "rejected", rejectionReason: "sourceSlotEmpty" };
  }

  const targetCharacter = campRoster[intoSlotIndex];

  if (targetCharacter === null) {
    return { outcome: "rejected", rejectionReason: "targetSlotEmpty" };
  }

  if (
    targetCharacter.characterTemplateId !== sourceCharacter.characterTemplateId
  ) {
    return { outcome: "rejected", rejectionReason: "charactersDoNotMatch" };
  }

  if (levelFromExperience(targetCharacter.experience) === MAX_CHARACTER_LEVEL) {
    return { outcome: "rejected", rejectionReason: "targetSlotAtMaxLevel" };
  }

  const nextCampRoster = [...campRoster];
  nextCampRoster[intoSlotIndex] = mergeCharacterInto(
    targetCharacter,
    sourceCharacter,
  );
  nextCampRoster[fromSlotIndex] = null;

  return { outcome: "accepted", nextCampRoster };
}
