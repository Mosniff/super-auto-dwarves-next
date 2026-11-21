import type {
  BattleCharacterLabel,
  BattleEvent,
  BattleEventDescriptor,
} from "./types";

export function describeBattleEvent(
  event: BattleEvent,
  characterLabelMap: Map<string, BattleCharacterLabel>,
): BattleEventDescriptor {
  const resolveCharacterLabel = (characterId: string): BattleCharacterLabel =>
    characterLabelMap.get(characterId) ?? { name: characterId, side: "unknown" };

  switch (event.type) {
    case "BATTLE_START":
      return {
        kind: "battleStart",
        playerFactionId: event.playerFactionId,
        enemyFactionId: event.enemyFactionId,
      };
    case "FRONTS_ENGAGE":
      return { kind: "frontsEngage" };
    case "TURN_START":
      return { kind: "turnStart", turn: event.turn };
    case "ATTACK":
      return {
        kind: "attack",
        attacker: resolveCharacterLabel(event.attackerId),
        target: resolveCharacterLabel(event.targetId),
      };
    case "DAMAGE":
      if (event.sourceAbilityId !== undefined) {
        return {
          kind: "abilityDamage",
          abilityId: event.sourceAbilityId,
          target: resolveCharacterLabel(event.targetId),
          amount: event.amount,
        };
      }
      return {
        kind: "damage",
        target: resolveCharacterLabel(event.targetId),
        amount: event.amount,
        resultingHp: event.resultingHp,
      };
    case "ARMOUR_DAMAGE":
      return {
        kind: "armourDamage",
        target: resolveCharacterLabel(event.targetId),
        amount: event.amount,
        resultingArmour: event.resultingArmour,
      };
    case "DROP":
      return { kind: "drop", character: resolveCharacterLabel(event.characterId) };
    case "TIMEOUT":
      return { kind: "timeout" };
    case "BATTLE_END":
      return { kind: "battleEnd", outcome: event.outcome };
    case "ABILITY_ACTIVATE":
      return {
        kind: "abilityActivate",
        abilityId: event.abilityId,
        character: resolveCharacterLabel(event.characterId),
      };
    case "STAT_CHANGE":
      return {
        kind: "abilityStatChange",
        abilityId: event.sourceAbilityId,
        target: resolveCharacterLabel(event.targetId),
        stat: event.stat,
        amount: event.amount,
        resultingValue: event.resultingValue,
      };
    default: {
      const exhaustiveCheck: never = event;
      return exhaustiveCheck;
    }
  }
}
