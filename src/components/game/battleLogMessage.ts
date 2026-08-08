import type { BattleEventDescriptor } from "@/lib/battle/types";

export function battleLogMessage(
  descriptor: BattleEventDescriptor,
): { key: string; params?: Record<string, string | number> } {
  switch (descriptor.kind) {
    case "battleStart":
      return { key: "battleStart" };
    case "turnStart":
      return { key: "turnStart", params: { turn: descriptor.turn } };
    case "attack":
      return {
        key: "attack",
        params: { attacker: descriptor.attacker, target: descriptor.target },
      };
    case "damage":
      return {
        key: "damage",
        params: {
          target: descriptor.target,
          amount: descriptor.amount,
          resultingHp: descriptor.resultingHp,
        },
      };
    case "drop":
      return { key: "drop", params: { character: descriptor.character } };
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
    default: {
      const exhaustiveCheck: never = descriptor;
      return exhaustiveCheck;
    }
  }
}
