import type { BattleEvent } from "./types";

export function formatBattleEvent(
  event: BattleEvent,
  nameMap: Map<string, string>,
): string {
  const resolveName = (characterId: string) =>
    nameMap.get(characterId) ?? characterId;

  switch (event.type) {
    case "BATTLE_START":
      return "Battle start!";
    case "TURN_START":
      return `Turn ${event.turn}`;
    case "ATTACK":
      return `${resolveName(event.attackerId)} attacks ${resolveName(event.targetId)}`;
    case "DAMAGE":
      return `${resolveName(event.targetId)} takes ${event.amount} damage (${event.resultingHp} HP)`;
    case "DROP":
      return `${resolveName(event.characterId)} drops`;
    case "TIMEOUT":
      return "Turn limit reached — stalemate";
    case "BATTLE_END":
      switch (event.outcome) {
        case "playerWin":
          return "Victory!";
        case "enemyWin":
          return "Defeat";
        case "draw":
          return "Draw";
      }
    default: {
      const exhaustiveCheck: never = event;
      return exhaustiveCheck;
    }
  }
}
