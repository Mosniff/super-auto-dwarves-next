import type { BattleEvent, BattleEventDescriptor } from "./types";

export function describeBattleEvent(
  event: BattleEvent,
  nameMap: Map<string, string>,
): BattleEventDescriptor {
  const resolveName = (characterId: string) =>
    nameMap.get(characterId) ?? characterId;

  switch (event.type) {
    case "BATTLE_START":
      return { kind: "battleStart" };
    case "TURN_START":
      return { kind: "turnStart", turn: event.turn };
    case "ATTACK":
      return {
        kind: "attack",
        attacker: resolveName(event.attackerId),
        target: resolveName(event.targetId),
      };
    case "DAMAGE":
      return {
        kind: "damage",
        target: resolveName(event.targetId),
        amount: event.amount,
        resultingHp: event.resultingHp,
      };
    case "DROP":
      return { kind: "drop", character: resolveName(event.characterId) };
    case "TIMEOUT":
      return { kind: "timeout" };
    case "BATTLE_END":
      return { kind: "battleEnd", outcome: event.outcome };
    default: {
      const exhaustiveCheck: never = event;
      return exhaustiveCheck;
    }
  }
}
