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

// The real lists and the depth table (Phase 13, the human's design).
// Kobolds at every depth for now.
export const ENEMY_LISTS: Readonly<Record<string, EnemyList>> = {
  kobolds: {
    enemyListId: "kobolds",
    enemyFactionId: "kobold",
    entries: [
      { characterTemplateId: "kobold-runt", cost: 1, position: 1 },
      { characterTemplateId: "kobold-thief", cost: 2, position: 2 },
    ],
  },
};

export const ENEMY_LIST_DEPTH_BREAKPOINTS: readonly EnemyListDepthBreakpoint[] =
  [{ fromDepth: 1, enemyListId: "kobolds" }];

export function findEnemyList(enemyListId: string): EnemyList {
  if (!Object.hasOwn(ENEMY_LISTS, enemyListId)) {
    throw new Error(`Unknown enemy list: ${enemyListId}`);
  }

  return ENEMY_LISTS[enemyListId];
}
