import { describe, it, expect } from "vitest";
import type { Character } from "./character";
import type { CharacterTemplate } from "./characterTemplates";
import type { EnemyList } from "./enemyLists";
import { buildTestCharacterTemplate } from "@/test/characterFixtures";
import { generateEnemyCharacters } from "./generateEnemyCharacters";

const fixtureTemplates: CharacterTemplate[] = [
  buildTestCharacterTemplate({
    characterTemplateId: "fixture-runt",
    name: "Fixture Runt",
    characterFactionId: "kobold",
    attack: 1,
    maxHp: 3,
  }),
  buildTestCharacterTemplate({
    characterTemplateId: "fixture-thief",
    name: "Fixture Thief",
    characterFactionId: "kobold",
    attack: 2,
    maxHp: 3,
  }),
];

function findFixtureTemplate(characterTemplateId: string) {
  return fixtureTemplates.find(
    (characterTemplate) =>
      characterTemplate.characterTemplateId === characterTemplateId,
  );
}

// Runt: cost 1, position 2. Thief: cost 2, position 1 (the front).
const fixtureEnemyList: EnemyList = {
  enemyListId: "fixture-list",
  enemyFactionId: "kobold",
  entries: [
    { characterTemplateId: "fixture-runt", cost: 1, position: 2 },
    { characterTemplateId: "fixture-thief", cost: 2, position: 1 },
  ],
};

// Returns the scripted indexes in order and records every optionCount.
function buildScriptedChooser(scriptedIndexes: number[]) {
  const receivedOptionCounts: number[] = [];
  let nextScriptIndex = 0;

  function chooseRandomIndex(optionCount: number): number {
    receivedOptionCounts.push(optionCount);
    const scriptedIndex = scriptedIndexes[nextScriptIndex];
    nextScriptIndex += 1;

    if (scriptedIndex === undefined) {
      throw new Error("scripted chooser ran out of indexes");
    }

    return scriptedIndex;
  }

  return { chooseRandomIndex, receivedOptionCounts };
}

const alwaysFirstIndex = () => 0;

function summarise(enemyCharacters: Character[]) {
  return enemyCharacters.map((enemyCharacter) => ({
    id: enemyCharacter.id,
    characterTemplateId: enemyCharacter.characterTemplateId,
    experience: enemyCharacter.experience,
    attack: enemyCharacter.attack,
    maxHp: enemyCharacter.maxHp,
  }));
}

describe("generateEnemyCharacters", () => {
  it("GE1: buys a random affordable entry while points last, then orders by position with ids from the front", () => {
    // 4 points: [runt, thief] -> runt (3 left); [runt, thief] -> thief
    // (1 left); [runt] -> runt (0 left). No XP points remain.
    const { chooseRandomIndex, receivedOptionCounts } = buildScriptedChooser([
      0, 1, 0,
    ]);

    const enemyCharacters = generateEnemyCharacters(
      fixtureEnemyList,
      4,
      findFixtureTemplate,
      chooseRandomIndex,
    );

    expect({
      enemies: summarise(enemyCharacters),
      receivedOptionCounts,
    }).toEqual({
      enemies: [
        { id: "enemy-1", characterTemplateId: "fixture-thief", experience: 0, attack: 2, maxHp: 3 },
        { id: "enemy-2", characterTemplateId: "fixture-runt", experience: 0, attack: 1, maxHp: 3 },
        { id: "enemy-3", characterTemplateId: "fixture-runt", experience: 0, attack: 1, maxHp: 3 },
      ],
      receivedOptionCounts: [2, 2, 1],
    });
  });

  it("GE2: stops buying at seven enemies, then spends each remaining point as 1 XP through gainExperience, skipping max-level enemies", () => {
    // 27 points, always the first option: seven runts (7 points), then 20
    // XP points. The first runt takes 15 (max) and the second takes 5.
    const runtOnlyList: EnemyList = {
      ...fixtureEnemyList,
      entries: [{ characterTemplateId: "fixture-runt", cost: 1, position: 1 }],
    };

    const enemyCharacters = generateEnemyCharacters(
      runtOnlyList,
      27,
      findFixtureTemplate,
      alwaysFirstIndex,
    );

    expect(
      enemyCharacters.map((enemyCharacter) => ({
        experience: enemyCharacter.experience,
        attack: enemyCharacter.attack,
        hp: enemyCharacter.hp,
        maxHp: enemyCharacter.maxHp,
      })),
    ).toEqual([
      { experience: 15, attack: 16, hp: 18, maxHp: 18 },
      { experience: 5, attack: 6, hp: 8, maxHp: 8 },
      { experience: 0, attack: 1, hp: 3, maxHp: 3 },
      { experience: 0, attack: 1, hp: 3, maxHp: 3 },
      { experience: 0, attack: 1, hp: 3, maxHp: 3 },
      { experience: 0, attack: 1, hp: 3, maxHp: 3 },
      { experience: 0, attack: 1, hp: 3, maxHp: 3 },
    ]);
  });

  it("GE3: each XP point picks uniformly among enemies below max level; points beyond everyone's max are discarded", () => {
    // Runts cost 3 here. 7 points: buy a runt ([1]), buy a runt ([1]),
    // 1 point left and nothing affordable, so 1 XP point: [first, second]
    // -> the scripted 1 gives it to the second runt.
    const costThreeRuntList: EnemyList = {
      ...fixtureEnemyList,
      entries: [{ characterTemplateId: "fixture-runt", cost: 3, position: 1 }],
    };
    const runtOnlyList: EnemyList = {
      ...fixtureEnemyList,
      entries: [{ characterTemplateId: "fixture-runt", cost: 1, position: 1 }],
    };
    const { chooseRandomIndex, receivedOptionCounts } = buildScriptedChooser([
      0, 0, 1,
    ]);

    const twoRunts = generateEnemyCharacters(
      costThreeRuntList,
      7,
      findFixtureTemplate,
      chooseRandomIndex,
    );
    // seven runts (7 points), all reach max (105 points), 3 left over
    const everyoneMaxed = generateEnemyCharacters(
      runtOnlyList,
      7 + 7 * 15 + 3,
      findFixtureTemplate,
      alwaysFirstIndex,
    );

    expect({
      twoRuntsExperience: twoRunts.map((enemy) => enemy.experience),
      receivedOptionCounts,
      everyoneMaxedExperience: everyoneMaxed.map((enemy) => enemy.experience),
    }).toEqual({
      twoRuntsExperience: [0, 1],
      receivedOptionCounts: [1, 1, 2],
      everyoneMaxedExperience: [15, 15, 15, 15, 15, 15, 15],
    });
  });

  it("GE4: with nothing affordable, the roster is one free copy of the cheapest entry (ties: earliest)", () => {
    const pricedList: EnemyList = {
      ...fixtureEnemyList,
      entries: [
        { characterTemplateId: "fixture-thief", cost: 3, position: 1 },
        { characterTemplateId: "fixture-runt", cost: 2, position: 2 },
        { characterTemplateId: "fixture-thief", cost: 2, position: 3 },
      ],
    };

    expect(
      summarise(
        generateEnemyCharacters(pricedList, 1, findFixtureTemplate, alwaysFirstIndex),
      ),
    ).toEqual([
      { id: "enemy-1", characterTemplateId: "fixture-runt", experience: 0, attack: 1, maxHp: 3 },
    ]);
  });

  it("GE5: throws for invalid points or an unknown template", () => {
    const unknownTemplateList: EnemyList = {
      ...fixtureEnemyList,
      entries: [{ characterTemplateId: "no-such-template", cost: 1, position: 1 }],
    };

    expect(
      [
        () => generateEnemyCharacters(fixtureEnemyList, -1, findFixtureTemplate, alwaysFirstIndex),
        () => generateEnemyCharacters(fixtureEnemyList, 1.5, findFixtureTemplate, alwaysFirstIndex),
        () => generateEnemyCharacters(unknownTemplateList, 1, findFixtureTemplate, alwaysFirstIndex),
      ].map((generate) => {
        try {
          generate();
          return false;
        } catch {
          return true;
        }
      }),
    ).toEqual([true, true, true]);
  });
});
