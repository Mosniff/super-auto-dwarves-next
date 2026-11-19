import { CAMP_ROSTER_SLOT_COUNT } from "./campRoster";
import type { Character } from "./character";
import type { CharacterAbility } from "./characterAbilities";
import { findCharacterAbilityForCharacter } from "./characterAbilityLookup";
import {
  gainExperience,
  MAX_CHARACTER_EXPERIENCE,
} from "./characterExperience";
import type { CharacterTemplate } from "./characterTemplates";
import type { ChooseRandomIndex } from "./chooseRandomIndex";
import type { EnemyList, EnemyListEntry } from "./enemyLists";
import { spawnCharacterFromTemplate } from "./spawnCharacterFromTemplate";

interface PurchasedEnemy {
  enemyListEntry: EnemyListEntry;
  character: Character;
}

// Builds an enemy roster from a list and a points budget (Phase 13, the
// human's design). Randomness is injected; the server rolls it once and the
// result is stored, never regenerated.
// 1. Buy: while a slot is empty and an entry is affordable, buy a uniformly
//    random affordable entry.
// 2. XP: each remaining point is 1 XP for a uniformly random enemy below
//    max level, through gainExperience; points left when every enemy is at
//    max level are discarded.
// 3. Order: by position, lowest at the front; copies keep purchase order.
// 4. Safety: an empty roster gets one free copy of the cheapest entry (ties:
//    earliest in the list).
// Ids are enemy-1, enemy-2, … from the front.
export function generateEnemyCharacters(
  enemyList: EnemyList,
  points: number,
  findCharacterTemplate: (
    characterTemplateId: string,
  ) => CharacterTemplate | undefined,
  chooseRandomIndex: ChooseRandomIndex,
  findAbility: (
    character: Character,
  ) => CharacterAbility | undefined = findCharacterAbilityForCharacter,
): Character[] {
  if (!Number.isInteger(points) || points < 0) {
    throw new Error(`invalid enemy points: ${points}`);
  }

  function spawnEnemy(enemyListEntry: EnemyListEntry): Character {
    const characterTemplate = findCharacterTemplate(
      enemyListEntry.characterTemplateId,
    );

    if (characterTemplate === undefined) {
      throw new Error(
        `unknown enemy template: ${enemyListEntry.characterTemplateId}`,
      );
    }

    return spawnCharacterFromTemplate(characterTemplate, "enemy-unassigned");
  }

  const purchasedEnemies: PurchasedEnemy[] = [];
  let remainingPoints = points;

  while (purchasedEnemies.length < CAMP_ROSTER_SLOT_COUNT) {
    const affordableEntries = enemyList.entries.filter(
      (enemyListEntry) => enemyListEntry.cost <= remainingPoints,
    );

    if (affordableEntries.length === 0) {
      break;
    }

    const boughtEntry =
      affordableEntries[chooseRandomIndex(affordableEntries.length)];
    purchasedEnemies.push({
      enemyListEntry: boughtEntry,
      character: spawnEnemy(boughtEntry),
    });
    remainingPoints -= boughtEntry.cost;
  }

  for (
    let experiencePointIndex = 0;
    experiencePointIndex < remainingPoints;
    experiencePointIndex += 1
  ) {
    const eligibleEnemyIndexes = purchasedEnemies
      .map((purchasedEnemy, purchasedEnemyIndex) => ({
        purchasedEnemy,
        purchasedEnemyIndex,
      }))
      .filter(
        ({ purchasedEnemy }) =>
          purchasedEnemy.character.experience < MAX_CHARACTER_EXPERIENCE,
      )
      .map(({ purchasedEnemyIndex }) => purchasedEnemyIndex);

    if (eligibleEnemyIndexes.length === 0) {
      break;
    }

    const receivingEnemyIndex =
      eligibleEnemyIndexes[chooseRandomIndex(eligibleEnemyIndexes.length)];
    const receivingEnemy = purchasedEnemies[receivingEnemyIndex];
    purchasedEnemies[receivingEnemyIndex] = {
      ...receivingEnemy,
      character: gainExperience(receivingEnemy.character, 1, findAbility),
    };
  }

  if (purchasedEnemies.length === 0 && enemyList.entries.length > 0) {
    const cheapestEntry = enemyList.entries.reduce(
      (cheapestSoFar, enemyListEntry) =>
        enemyListEntry.cost < cheapestSoFar.cost ? enemyListEntry : cheapestSoFar,
    );
    purchasedEnemies.push({
      enemyListEntry: cheapestEntry,
      character: spawnEnemy(cheapestEntry),
    });
  }

  return [...purchasedEnemies]
    .sort(
      (firstEnemy, secondEnemy) =>
        firstEnemy.enemyListEntry.position - secondEnemy.enemyListEntry.position,
    )
    .map((purchasedEnemy, frontIndex) => ({
      ...purchasedEnemy.character,
      id: `enemy-${frontIndex + 1}`,
    }));
}
