import { describe, it, expect } from "vitest";
import type { Character } from "./character";
import { resolveBattle } from "@/lib/battle/resolveBattle";
import { createEmptyCampRoster, squeezeCampRoster, type CampRoster } from "./campRoster";
import { resolveCampBattle } from "./resolveCampBattle";

function buildFixtureCharacter(
  id: string,
  name: string,
  attack: number,
  hp: number,
): Character {
  return {
    id,
    name,
    attack,
    hp,
    maxHp: hp,
    characterTemplateId: "fixture-dwarf",
    tier: 1,
    characterClassIds: ["warrior"],
  };
}

const fixtureEnemies: Character[] = [
  buildFixtureCharacter("fixture-enemy-1", "Enemy One", 4, 6),
  buildFixtureCharacter("fixture-enemy-2", "Enemy Two", 3, 8),
];

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

    const resolvedBattle = resolveCampBattle(campRosterWithGaps, fixtureEnemies);

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

    const resolvedBattle = resolveCampBattle(campRosterWithGaps, fixtureEnemies);

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
      fixtureEnemies,
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

    const resolvedBattle = resolveCampBattle(campRosterWithGaps, fixtureEnemies);

    expect(resolvedBattle).toEqual(
      resolveBattle(
        squeezeCampRoster(campRosterWithGaps).activeCharacters,
        fixtureEnemies,
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

    resolveCampBattle(campRosterWithGaps, fixtureEnemies);

    expect(campRosterWithGaps).toEqual(campRosterClone);
  });
});
