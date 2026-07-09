import type { BattleState, ResolvedBattle } from "./types";
import { applyEvent } from "./applyEvent";
import { formatBattleEvent } from "./formatBattleEvent";
import { buildNameMap } from "./buildNameMap";

interface BattlePlaybackView {
  currentState: BattleState;
  logLines: string[];
  isFinished: boolean;
}

export function deriveBattlePlaybackState(
  resolvedBattle: ResolvedBattle,
  position: number,
): BattlePlaybackView {
  const appliedEvents = resolvedBattle.events.slice(0, position + 1);
  const nameMap = buildNameMap(resolvedBattle.initialState);

  const currentState = appliedEvents.reduce(
    (state, event) => applyEvent(state, event),
    resolvedBattle.initialState,
  );

  const logLines = appliedEvents.map((event) =>
    formatBattleEvent(event, nameMap),
  );

  const isFinished = position === resolvedBattle.events.length - 1;

  return { currentState, logLines, isFinished };
}
