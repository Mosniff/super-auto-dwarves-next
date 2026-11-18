import { describe, it, expect } from "vitest";
import type { Character } from "@/lib/game/character";
import type { CampRoster } from "@/lib/game/campRoster";
import { buildTestCharacter } from "@/test/characterFixtures";
import { resolveBattle } from "@/lib/battle/resolveBattle";
import {
  battleBoardStage,
  presentBattleBoard,
} from "./battleBoardPresentation";

// mechanical refactor: replaced with a single buildTestCharacter call
function buildFixtureCharacter(id: string, name: string): Character {
  return buildTestCharacter({
    id,
    name,
    attack: 1,
    hp: 10,
    maxHp: 10,
    characterTemplateId: "fixture-dwarf",
    tier: 1,
    characterClassIds: ["warrior"],
    experience: 0,
  });
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

    // deliberate input rewrite: hasBattleStarted became battleBoardStage (Phase 12 step 11b)
    const presentation = presentBattleBoard({
      battleState: {
        player: { activeCharacters: [aldric, brann], downedCharacters: [] },
        enemy: { activeCharacters: [xog, yarl], downedCharacters: [] },
      },
      battleBoardStage: "beforeBattle",
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

    // deliberate input rewrite: hasBattleStarted became battleBoardStage (Phase 12 step 11b)
    const presentation = presentBattleBoard({
      battleState: {
        player: { activeCharacters: [], downedCharacters: [] },
        enemy: { activeCharacters: [xog], downedCharacters: [] },
      },
      battleBoardStage: "beforeBattle",
      playerCampRoster,
    });

    expect(presentation).toEqual({
      playerBenchCharacters: [null, null, null, null, null, null, null],
      playerFrontCharacter: undefined,
      enemyBenchCharacters: [xog],
      enemyFrontCharacter: undefined,
    });
  });

  it("(c) once the fronts have engaged, each front character is in the action zone and the benches are squeezed", () => {
    const playerCampRoster: CampRoster = [
      aldric,
      null,
      brann,
      null,
      null,
      null,
      null,
    ];

    // deliberate input rewrite: hasBattleStarted became battleBoardStage (Phase 12 step 11b)
    const presentation = presentBattleBoard({
      battleState: {
        player: { activeCharacters: [aldric, brann], downedCharacters: [] },
        enemy: { activeCharacters: [xog, yarl], downedCharacters: [] },
      },
      battleBoardStage: "engaged",
      playerCampRoster,
    });

    expect(presentation).toEqual({
      playerBenchCharacters: [brann],
      playerFrontCharacter: aldric,
      enemyBenchCharacters: [yarl],
      enemyFrontCharacter: xog,
    });
  });

  it("(d) once the fronts have engaged, presentation follows the battle state, not the camp roster", () => {
    const playerCampRoster: CampRoster = [
      aldric,
      null,
      brann,
      null,
      null,
      null,
      null,
    ];

    // deliberate input rewrite: hasBattleStarted became battleBoardStage (Phase 12 step 11b)
    const presentation = presentBattleBoard({
      battleState: {
        player: { activeCharacters: [brann], downedCharacters: [aldric] },
        enemy: { activeCharacters: [xog], downedCharacters: [yarl] },
      },
      battleBoardStage: "engaged",
      playerCampRoster,
    });

    expect(presentation).toEqual({
      playerBenchCharacters: [],
      playerFrontCharacter: brann,
      enemyBenchCharacters: [],
      enemyFrontCharacter: xog,
    });
  });

  it("(e) while preparing, everyone stays on the bench with the gaps closed, and both fronts are empty", () => {
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
      battleBoardStage: "preparing",
      playerCampRoster,
    });

    expect(presentation).toEqual({
      playerBenchCharacters: [aldric, brann],
      playerFrontCharacter: undefined,
      enemyBenchCharacters: [xog, yarl],
      enemyFrontCharacter: undefined,
    });
  });

  it("(f) the stage follows the playback beat: preparing until the engage beat has been applied; a battle that never engages stays preparing", () => {
    const engagingBattle = resolveBattle([aldric], [xog]);
    const neverEngagingBattle = resolveBattle([], [xog]);

    expect([
      [-1, 0, 1, 2].map((playbackBeat) =>
        battleBoardStage(engagingBattle.events, playbackBeat),
      ),
      [0, 1].map((playbackBeat) =>
        battleBoardStage(neverEngagingBattle.events, playbackBeat),
      ),
    ]).toEqual([
      ["beforeBattle", "preparing", "engaged", "engaged"],
      ["preparing", "preparing"],
    ]);
  });
});
