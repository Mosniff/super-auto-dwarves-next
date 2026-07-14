import type {
  BattleCharacter,
  BattleState,
  BattleEvent,
  BattleEventPayload,
  ResolvedBattle,
} from "./types";
import { applyEvent } from "./applyEvent";

export function resolveBattle(
  playerCharacters: BattleCharacter[],
  enemyCharacters: BattleCharacter[],
  maxTurns: number = 20,
): ResolvedBattle {
  const initialState: BattleState = {
    player: { activeCharacters: playerCharacters, downedCharacters: [] },
    enemy: { activeCharacters: enemyCharacters, downedCharacters: [] },
  };

  const events: BattleEvent[] = [];
  let workingState = initialState;

  let currentBeat = 0;
  const startNewBeat = () => {
    currentBeat += 1;
  };

  const emitEvent = (eventPayload: BattleEventPayload) => {
    const event: BattleEvent = { ...eventPayload, beat: currentBeat };
    events.push(event);
    workingState = applyEvent(workingState, event);
  };

  emitEvent({ type: "BATTLE_START" });

  let currentTurn = 1;

  while (
    workingState.player.activeCharacters.length > 0 &&
    workingState.enemy.activeCharacters.length > 0 &&
    currentTurn <= maxTurns
  ) {
    startNewBeat();
    emitEvent({ type: "TURN_START", turn: currentTurn });
    currentTurn += 1;

    const playerFrontCharacter = workingState.player.activeCharacters[0];
    const enemyFrontCharacter = workingState.enemy.activeCharacters[0];

    const playerDamageValue = Math.max(0, playerFrontCharacter.attack);
    const enemyDamageValue = Math.max(0, enemyFrontCharacter.attack);

    startNewBeat();
    emitEvent({
      type: "ATTACK",
      attackerId: playerFrontCharacter.id,
      targetId: enemyFrontCharacter.id,
      value: playerDamageValue,
    });
    emitEvent({
      type: "ATTACK",
      attackerId: enemyFrontCharacter.id,
      targetId: playerFrontCharacter.id,
      value: enemyDamageValue,
    });

    const enemyResultingHp = enemyFrontCharacter.hp - playerDamageValue;
    const playerResultingHp = playerFrontCharacter.hp - enemyDamageValue;

    emitEvent({
      type: "DAMAGE",
      targetId: enemyFrontCharacter.id,
      amount: playerDamageValue,
      resultingHp: enemyResultingHp,
      source: playerFrontCharacter.id,
    });
    emitEvent({
      type: "DAMAGE",
      targetId: playerFrontCharacter.id,
      amount: enemyDamageValue,
      resultingHp: playerResultingHp,
      source: enemyFrontCharacter.id,
    });

    const enemyDrops = enemyResultingHp <= 0;
    const playerDrops = playerResultingHp <= 0;

    if (enemyDrops || playerDrops) {
      startNewBeat();
    }
    if (enemyDrops) {
      emitEvent({ type: "DROP", characterId: enemyFrontCharacter.id });
    }
    if (playerDrops) {
      emitEvent({ type: "DROP", characterId: playerFrontCharacter.id });
    }
  }

  const playerWipedOut = workingState.player.activeCharacters.length === 0;
  const enemyWipedOut = workingState.enemy.activeCharacters.length === 0;

  const outcome =
    playerWipedOut && enemyWipedOut
      ? "draw"
      : enemyWipedOut
        ? "playerWin"
        : playerWipedOut
          ? "enemyWin"
          : "draw";

  const cappedInStalemate =
    currentTurn > maxTurns && !playerWipedOut && !enemyWipedOut;

  if (cappedInStalemate) {
    startNewBeat();
    emitEvent({ type: "TIMEOUT" });
  }

  startNewBeat();
  emitEvent({ type: "BATTLE_END", outcome });

  return { initialState, events };
}
