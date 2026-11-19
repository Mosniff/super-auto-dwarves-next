import { findCharacterTemplate } from "./characterTemplates";
import type { ChooseRandomIndex } from "./chooseRandomIndex";
import type { EnemyEncounter } from "./enemyEncounter";
import {
  chooseEnemyListIdForDepth,
  ENEMY_LIST_DEPTH_BREAKPOINTS,
  findEnemyList,
} from "./enemyLists";
import { generateEnemyCharacters } from "./generateEnemyCharacters";
import type { GameState } from "./types";

// The encounter for the battle being entered, from the state leaving camp
// (Phase 13): the list comes from the depth table, the points are
// day × depth, and the roster is generated with the server's randomness.
// The battle seed is rolled by the server too and only carried here.
export function generateEnemyEncounter(
  enteringGameState: GameState,
  chooseRandomIndex: ChooseRandomIndex,
  battleSeed: number,
): EnemyEncounter {
  const enemyList = findEnemyList(
    chooseEnemyListIdForDepth(
      enteringGameState.depth,
      ENEMY_LIST_DEPTH_BREAKPOINTS,
    ),
  );

  return {
    enemyFactionId: enemyList.enemyFactionId,
    enemyCharacters: generateEnemyCharacters(
      enemyList,
      enteringGameState.day * enteringGameState.depth,
      findCharacterTemplate,
      chooseRandomIndex,
    ),
    battleSeed,
  };
}
