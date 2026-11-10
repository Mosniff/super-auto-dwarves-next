import { describe, it, expect } from "vitest";
import type { Character } from "@/lib/game/character";
import type { CampRoster } from "@/lib/game/campRoster";
import { presentBattleBoard } from "./battleBoardPresentation";

function buildFixtureCharacter(id: string, name: string): Character {
  return {
    id,
    name,
    attack: 1,
    hp: 10,
    maxHp: 10,
    characterTemplateId: "fixture-dwarf",
    tier: 1,
    characterClassIds: ["warrior"],
  };
}

const aldric = buildFixtureCharacter("aldric", "Aldric");
const brann = buildFixtureCharacter("brann", "Brann");
const xog = buildFixtureCharacter("xog", "Xog");
const yarl = buildFixtureCharacter("yarl", "Yarl");

describe("presentBattleBoard", () => {
  it("(a) before the battle starts, the player's bench is the camp roster as saved and both fronts are empty", () => {
    const playerCampRoster: CampRoster = [
      aldric,
      null,
      brann,
      null,
      null,
      null,
      null,
    ];

    const presentation = presentBattleBoard({
      battleState: {
        player: { activeCharacters: [aldric, brann], downedCharacters: [] },
        enemy: { activeCharacters: [xog, yarl], downedCharacters: [] },
      },
      hasBattleStarted: false,
      playerCampRoster,
    });

    expect(presentation).toEqual({
      playerBenchCharacters: [aldric, null, brann, null, null, null, null],
      playerFrontCharacter: undefined,
      enemyBenchCharacters: [xog, yarl],
      enemyFrontCharacter: undefined,
    });
  });

  it("(b) before the battle starts, an empty camp roster shows seven empty slots", () => {
    const playerCampRoster: CampRoster = [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ];

    const presentation = presentBattleBoard({
      battleState: {
        player: { activeCharacters: [], downedCharacters: [] },
        enemy: { activeCharacters: [xog], downedCharacters: [] },
      },
      hasBattleStarted: false,
      playerCampRoster,
    });

    expect(presentation).toEqual({
      playerBenchCharacters: [null, null, null, null, null, null, null],
      playerFrontCharacter: undefined,
      enemyBenchCharacters: [xog],
      enemyFrontCharacter: undefined,
    });
  });

  it("(c) once the battle has started, each front character is in the action zone and the benches are squeezed", () => {
    const playerCampRoster: CampRoster = [
      aldric,
      null,
      brann,
      null,
      null,
      null,
      null,
    ];

    const presentation = presentBattleBoard({
      battleState: {
        player: { activeCharacters: [aldric, brann], downedCharacters: [] },
        enemy: { activeCharacters: [xog, yarl], downedCharacters: [] },
      },
      hasBattleStarted: true,
      playerCampRoster,
    });

    expect(presentation).toEqual({
      playerBenchCharacters: [brann],
      playerFrontCharacter: aldric,
      enemyBenchCharacters: [yarl],
      enemyFrontCharacter: xog,
    });
  });

  it("(d) once the battle has started, presentation follows the battle state, not the camp roster", () => {
    const playerCampRoster: CampRoster = [
      aldric,
      null,
      brann,
      null,
      null,
      null,
      null,
    ];

    const presentation = presentBattleBoard({
      battleState: {
        player: { activeCharacters: [brann], downedCharacters: [aldric] },
        enemy: { activeCharacters: [xog], downedCharacters: [yarl] },
      },
      hasBattleStarted: true,
      playerCampRoster,
    });

    expect(presentation).toEqual({
      playerBenchCharacters: [],
      playerFrontCharacter: brann,
      enemyBenchCharacters: [],
      enemyFrontCharacter: xog,
    });
  });
});
