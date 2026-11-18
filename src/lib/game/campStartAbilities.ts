import type { Character } from "./character";
import type { CharacterAbility, CharacterAbilityId } from "./characterAbilities";
import { findCharacterAbilityForCharacter } from "./characterAbilityLookup";
import { levelFromExperience } from "./characterExperience";
import type { CampRoster } from "./campRoster";

// onCampStart abilities (Phase 12): fired when the game moves from battle
// to camp, after gold resets, front to back (slot 0 first). The server
// applies them in advanceGame; the client re-runs this same pure function
// on the same roster only to animate them. Nothing about them is stored.
export interface CampStartActivation {
  characterId: string;
  slotIndex: number;
  abilityId: CharacterAbilityId;
  goldGained: number;
}

export function campStartActivations(
  campRoster: CampRoster,
  findAbility: (
    character: Character,
  ) => CharacterAbility | undefined = findCharacterAbilityForCharacter,
): CampStartActivation[] {
  const activations: CampStartActivation[] = [];

  for (let slotIndex = 0; slotIndex < campRoster.length; slotIndex += 1) {
    const character = campRoster[slotIndex];
    if (character === null) {
      continue;
    }

    const ability = findAbility(character);
    if (ability?.trigger !== "onCampStart") {
      continue;
    }

    // The guard above narrows the WHOLE CharacterAbility union down to a
    // single variant via control flow (checking the correlated `trigger`
    // field, not the switch's own discriminant), so by the project's
    // never-guard rule this asserts never on the object itself, not on
    // `ability.abilityId` (mirrors battleStartAbilities.ts's
    // planBattleStartAbility).
    let goldGained: number;
    switch (ability.abilityId) {
      case "penny-pincher":
        goldGained =
          ability.goldByLevel[levelFromExperience(character.experience) - 1];
        break;
      default: {
        const unreachableAbility: never = ability;
        throw new Error(
          `Unknown onCampStart ability: ${(unreachableAbility as CharacterAbility).abilityId}`,
        );
      }
    }

    activations.push({
      characterId: character.id,
      slotIndex,
      abilityId: ability.abilityId,
      goldGained,
    });
  }

  return activations;
}
