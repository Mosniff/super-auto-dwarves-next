import { describe, it, expect } from "vitest";
import type { Character } from "./character";
import { resolveBattle } from "@/lib/battle/resolveBattle";
import { createEmptyCampRoster, squeezeCampRoster, type CampRoster } from "./campRoster";
import { resolveCampBattle } from "./resolveCampBattle";
import { buildTestCharacter } from "@/test/characterFixtures";
import { buildTestEnemyEncounter } from "@/test/enemyEncounterFixtures";
import { createSeededChooseRandomIndex } from "./seededRandomSource";

// mechanical refactor: replaced with a single buildTestCharacter call
function buildFixtureCharacter(
  id: string,
  name: string,
  attack: number,
  hp: number,
): Character {
  return buildTestCharacter({
    id,
    name,
    attack,
    hp,
    maxHp: hp,
    characterTemplateId: "fixture-dwarf",
    tier: 1,
    characterClassIds: ["warrior"],
    experience: 0,
  });
}

const fixtureEnemies: Character[] = [
  buildFixtureCharacter("fixture-enemy-1", "Enemy One", 4, 6),
  buildFixtureCharacter("fixture-enemy-2", "Enemy Two", 3, 8),
];

const fixtureEnemyEncounter = buildTestEnemyEncounter({
  enemyFactionId: "dwarf",
  enemyCharacters: fixtureEnemies,
});

describe("resolveCampBattle", () => {
  it("(a) squeezes the camp roster into the player's starting line, front first", () => {
    const characterA = buildFixtureCharacter("character-a", "Dwarf A", 3, 5);
    const characterB = buildFixtureCharacter("character-b", "Dwarf B", 4, 6);
    const campRosterWithGaps: CampRoster = [
      null,
      characterA,
      null,
      characterB,
      null,
      null,
      null,
    ];

    const resolvedBattle = resolveCampBattle(campRosterWithGaps, fixtureEnemyEncounter);

    expect(
      resolvedBattle.initialState.player.activeCharacters.map(
        (character) => character.id,
      ),
    ).toEqual([characterA.id, characterB.id]);
    expect(resolvedBattle.initialState.player.downedCharacters).toEqual([]);
  });

  it("(b) uses the given enemy characters as the enemy's starting line", () => {
    const characterA = buildFixtureCharacter("character-a", "Dwarf A", 3, 5);
    const campRosterWithGaps: CampRoster = [
      characterA,
      null,
      null,
      null,
      null,
      null,
      null,
    ];

    const resolvedBattle = resolveCampBattle(campRosterWithGaps, fixtureEnemyEncounter);

    expect(
      resolvedBattle.initialState.enemy.activeCharacters.map(
        (character) => character.id,
      ),
    ).toEqual(fixtureEnemies.map((character) => character.id));
  });

  it("(c) an empty camp roster loses instantly", () => {
    const allEmptyCampRoster: CampRoster = createEmptyCampRoster();

    const resolvedBattle = resolveCampBattle(
      allEmptyCampRoster,
      fixtureEnemyEncounter,
    );

    expect(resolvedBattle.events.map((battleEvent) => battleEvent.type)).toEqual(
      ["BATTLE_START", "BATTLE_END"],
    );
    expect(resolvedBattle.events.at(-1)).toMatchObject({
      type: "BATTLE_END",
      outcome: "enemyWin",
    });
  });

  it("(d) resolves exactly as resolveBattle does on the squeezed line", () => {
    const characterA = buildFixtureCharacter("character-a", "Dwarf A", 3, 5);
    const characterB = buildFixtureCharacter("character-b", "Dwarf B", 4, 6);
    const campRosterWithGaps: CampRoster = [
      null,
      characterA,
      null,
      characterB,
      null,
      null,
      null,
    ];

    const resolvedBattle = resolveCampBattle(campRosterWithGaps, fixtureEnemyEncounter);

    // deliberate assertion rewrite: resolveBattle(…, fixtureEnemies) before; resolveBattle(…, fixtureEnemies, undefined, undefined, { playerFactionId: "dwarf", enemyFactionId: "dwarf" }) after — Phase 13
    expect(resolvedBattle).toEqual(
      resolveBattle(
        squeezeCampRoster(campRosterWithGaps).activeCharacters,
        fixtureEnemies,
        undefined,
        undefined,
        { playerFactionId: "dwarf", enemyFactionId: "dwarf" },
      ),
    );
  });

  it("(e) does not mutate the camp roster", () => {
    const characterA = buildFixtureCharacter("character-a", "Dwarf A", 3, 5);
    const campRosterWithGaps: CampRoster = [
      null,
      characterA,
      null,
      null,
      null,
      null,
      null,
    ];
    const campRosterClone = structuredClone(campRosterWithGaps);

    resolveCampBattle(campRosterWithGaps, fixtureEnemyEncounter);

    expect(campRosterWithGaps).toEqual(campRosterClone);
  });

  it("(f) passes the player's faction and the encounter's faction to the battle start", () => {
    const resolvedBattle = resolveCampBattle(
      createEmptyCampRoster(),
      buildTestEnemyEncounter({
        enemyFactionId: "kobold",
        enemyCharacters: fixtureEnemies,
      }),
    );

    expect(resolvedBattle.events[0]).toEqual({
      type: "BATTLE_START",
      playerFactionId: "dwarf",
      enemyFactionId: "kobold",
      beatIndex: 0,
      beatType: "BATTLE_START",
    });
  });

  it("(g) the stored seed drives the battle's randomness: one seed replays identically, and the resolve matches a source seeded from it", () => {
    const campRoster = createEmptyCampRoster();
    campRoster[0] = buildTestCharacter({ id: "p1", attack: 0, hp: 10, maxHp: 10 });
    campRoster[1] = buildTestCharacter({ id: "p2", attack: 0, hp: 10, maxHp: 10 });
    campRoster[2] = buildTestCharacter({ id: "p3", attack: 0, hp: 10, maxHp: 10 });
    const thiefEncounter = buildTestEnemyEncounter({
      enemyFactionId: "kobold",
      enemyCharacters: [
        buildTestCharacter({
          id: "thief",
          characterTemplateId: "kobold-thief",
          characterFactionId: "kobold",
          attack: 2,
          hp: 3,
          maxHp: 3,
          experience: 15,
        }),
      ],
      battleSeed: 2026,
    });

    expect({
      replaysIdentically:
        JSON.stringify(resolveCampBattle(campRoster, thiefEncounter)) ===
        JSON.stringify(resolveCampBattle(campRoster, thiefEncounter)),
      matchesSeededResolve: resolveCampBattle(campRoster, thiefEncounter),
    }).toEqual({
      replaysIdentically: true,
      matchesSeededResolve: resolveBattle(
        squeezeCampRoster(campRoster).activeCharacters,
        thiefEncounter.enemyCharacters,
        undefined,
        undefined,
        { playerFactionId: "dwarf", enemyFactionId: "kobold" },
        createSeededChooseRandomIndex(2026),
      ),
    });
  });
});
