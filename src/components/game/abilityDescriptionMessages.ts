import type { CharacterAbility } from "@/lib/game/characterAbilities";

// Keys are relative to the "ability" message namespace.
export interface AbilityDescriptionMessages {
  nameKey: string;
  summaryKey: string;
  levelTexts: { key: string; params: Record<string, number> }[];
}

// Pure: ability data → translation keys and params; the leaf component
// translates (the same split as battleLogMessage).
export function abilityDescriptionMessages(
  ability: CharacterAbility,
): AbilityDescriptionMessages {
  const nameKey = `${ability.abilityId}.name`;
  const summaryKey = `${ability.abilityId}.summary`;

  switch (ability.abilityId) {
    case "growing-lad":
      return {
        nameKey,
        summaryKey,
        levelTexts: ability.extraHpPerExperiencePointByLevel.map(
          (extraHp) => ({
            key: "growing-lad.levelText",
            params: { extraHp },
          }),
        ),
      };
    case "tighten-those-straps-son":
      return {
        nameKey,
        summaryKey,
        levelTexts: ability.targetingByLevel.map(
          (
            targeting,
            levelIndex,
          ): { key: string; params: Record<string, number> } => {
            const armour = ability.armourGrantedByLevel[levelIndex];
            if (targeting.kind === "alliesAhead") {
              return {
                key: "tighten-those-straps-son.levelTextAlliesAhead",
                params: { armour, count: targeting.count },
              };
            }
            return {
              key: "tighten-those-straps-son.levelTextWholeParty",
              params: { armour },
            };
          },
        ),
      };
    case "penny-pincher":
      return {
        nameKey,
        summaryKey,
        levelTexts: ability.goldByLevel.map((gold) => ({
          key: "penny-pincher.levelText",
          params: { gold },
        })),
      };
    default: {
      const unreachableAbility: never = ability;
      throw new Error(
        `Unknown ability id: ${(unreachableAbility as CharacterAbility).abilityId}`,
      );
    }
  }
}
