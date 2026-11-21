import type { BattleEventDescriptor } from "@/lib/battle/types";
import type { CharacterFactionId } from "@/lib/game/characterFactions";

export function battleLogMessage(
  descriptor: BattleEventDescriptor,
): {
  // Absent means "battle" (the default namespace); ability lines live in
  // the ability namespace with the ability's description, keyed by
  // ability id (Phase 12).
  namespace?: "ability";
  key: string;
  params?: Record<string, string | number>;
  // Faction ids the leaf translates into each faction's pluralName (the
  // faction namespace) and adds to params under these names (Phase 13).
  factionParams?: Record<string, CharacterFactionId>;
} {
  switch (descriptor.kind) {
    case "battleStart":
      return {
        key: "battleStart",
        factionParams: {
          playerFaction: descriptor.playerFactionId,
          enemyFaction: descriptor.enemyFactionId,
        },
      };
    case "frontsEngage":
      return { key: "frontsEngage" };
    case "turnStart":
      return { key: "turnStart", params: { turn: descriptor.turn } };
    case "attack":
      return {
        key: "attack",
        params: { attacker: descriptor.attacker.name, target: descriptor.target.name },
      };
    case "damage":
      return {
        key: "damage",
        params: {
          target: descriptor.target.name,
          amount: descriptor.amount,
          resultingHp: descriptor.resultingHp,
        },
      };
    case "armourDamage":
      // The break/absorb choice lives here, not in the descriptor — the
      // descriptor carries the raw resultingArmour, and this is the only
      // place that decides what it means, the same way battleEnd's raw
      // outcome maps to its key.
      return descriptor.resultingArmour === 0
        ? { key: "armourBreak", params: { target: descriptor.target.name } }
        : {
            key: "armourDamage",
            params: { target: descriptor.target.name, amount: descriptor.amount },
          };
    case "drop":
      return { key: "drop", params: { character: descriptor.character.name } };
    case "timeout":
      return { key: "timeout" };
    case "battleEnd":
      switch (descriptor.outcome) {
        case "playerWin":
          return { key: "victory" };
        case "enemyWin":
          return { key: "defeat" };
        case "draw":
          return { key: "draw" };
        default: {
          const exhaustiveOutcomeCheck: never = descriptor.outcome;
          return exhaustiveOutcomeCheck;
        }
      }
    case "abilityActivate":
      return {
        namespace: "ability",
        key: `${descriptor.abilityId}.battleCry`,
        params: { character: descriptor.character.name },
      };
    case "abilityDamage":
      return {
        namespace: "ability",
        key: `${descriptor.abilityId}.targetEffect`,
        params: { target: descriptor.target.name, amount: descriptor.amount },
      };
    case "abilityStatChange":
      return {
        namespace: "ability",
        key: `${descriptor.abilityId}.targetEffect`,
        params: { target: descriptor.target.name, amount: descriptor.amount },
      };
    default: {
      const exhaustiveCheck: never = descriptor;
      return exhaustiveCheck;
    }
  }
}
