// The info scroll's turn header (Phase 14): "Pre-battle" before turn 1,
// then the turn in effect at the viewed beat. It hides on a turn-start
// beat, where the big "Turn N begins!" line fills the scroll instead.
import type { BattleEventDescriptor } from "@/lib/battle/types";

export type InfoScrollHeader =
  | { kind: "preBattle" }
  | { kind: "turn"; turn: number }
  | { kind: "hidden" };

export function infoScrollHeader(
  viewedTurn: number,
  currentBeatDescriptors: BattleEventDescriptor[],
): InfoScrollHeader {
  if (
    currentBeatDescriptors.some((descriptor) => descriptor.kind === "turnStart")
  ) {
    return { kind: "hidden" };
  }

  return viewedTurn === 0
    ? { kind: "preBattle" }
    : { kind: "turn", turn: viewedTurn };
}
