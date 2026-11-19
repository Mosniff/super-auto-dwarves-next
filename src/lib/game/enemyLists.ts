import type { CharacterFactionId } from "./characterFactions";

// One purchasable enemy in a faction's list (Phase 13). position orders the
// generated roster (lowest at the front) and is unique within a list.
export interface EnemyListEntry {
  characterTemplateId: string;
  cost: number;
  position: number;
}

export interface EnemyList {
  enemyListId: string;
  enemyFactionId: CharacterFactionId;
  entries: readonly EnemyListEntry[];
}

// Which list a depth uses: the last breakpoint whose fromDepth is at or
// below the depth. Ordered by fromDepth ascending, starting at depth 1;
// the last entry is open-ended (Phase 13).
export interface EnemyListDepthBreakpoint {
  fromDepth: number;
  enemyListId: string;
}

export function chooseEnemyListIdForDepth(
  depth: number,
  enemyListDepthBreakpoints: readonly EnemyListDepthBreakpoint[],
): string {
  let chosenEnemyListId: string | undefined;

  for (const enemyListDepthBreakpoint of enemyListDepthBreakpoints) {
    if (enemyListDepthBreakpoint.fromDepth <= depth) {
      chosenEnemyListId = enemyListDepthBreakpoint.enemyListId;
    }
  }

  if (chosenEnemyListId === undefined) {
    throw new Error(`No enemy list covers depth ${depth}.`);
  }

  return chosenEnemyListId;
}
