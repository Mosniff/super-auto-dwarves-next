import type { Character } from "./character";
import {
  findCharacterAbility,
  type CharacterAbility,
} from "./characterAbilities";
import {
  findCharacterTemplate,
  type CharacterTemplate,
} from "./characterTemplates";

// A character's ability comes from its template (one ability per template;
// saves store nothing about abilities). The template lookup is injected as
// a last, optional argument so tests can use fixture templates. Returns
// undefined when the template can't be found (characters are
// self-contained and template ids are never deleted, so this is defensive).
export function findCharacterAbilityForCharacter(
  character: Pick<Character, "characterTemplateId">,
  findTemplate: (
    characterTemplateId: string,
  ) => CharacterTemplate | undefined = findCharacterTemplate,
): CharacterAbility | undefined {
  const characterTemplate = findTemplate(character.characterTemplateId);
  return characterTemplate === undefined
    ? undefined
    : findCharacterAbility(characterTemplate.abilityId);
}
