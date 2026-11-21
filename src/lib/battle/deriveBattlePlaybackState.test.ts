import { describe, it, expect } from "vitest";
import { deriveBattlePlaybackState } from "./deriveBattlePlaybackState";
import { resolveBattle } from "./resolveBattle";
import { applyEvent } from "./applyEvent";
import type { Character } from "@/lib/game/character";
import type { ResolvedBattle } from "./types";
import { buildTestCharacter } from "@/test/characterFixtures";

describe("deriveBattlePlaybackState", () => {
  // mechanical refactor: replaced with buildTestCharacter
  const playerCharacters: Character[] = [
    buildTestCharacter({ id: "p1", name: "Borin", attack: 2, hp: 3, maxHp: 3, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    buildTestCharacter({ id: "p2", name: "Thrudi", attack: 4, hp: 5, maxHp: 5, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
  ];
  const enemyCharacters: Character[] = [
    buildTestCharacter({ id: "e1", name: "Grukk", attack: 2, hp: 6, maxHp: 6, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
  ];
  const resolvedBattle = resolveBattle(playerCharacters, enemyCharacters);

  const highestBeat = Math.max(
    ...resolvedBattle.events.map((event) => event.beatIndex),
  );

  it("at playbackBeat -1 / viewingBeat -1: nothing is applied, log is empty, not finished", () => {
    const playbackView = deriveBattlePlaybackState(resolvedBattle, -1, -1);

    expect(playbackView.currentState).toEqual(resolvedBattle.initialState);
    expect(playbackView.currentBeatDescriptors).toEqual([]);
    expect(playbackView.isFinished).toBe(false);
  });

  // deliberate assertion rewrite: { kind: "battleStart" } before; { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "dwarf" } after — Phase 13
  it("at playbackBeat 0 / viewingBeat 0: only BATTLE_START is applied", () => {
    const playbackView = deriveBattlePlaybackState(resolvedBattle, 0, 0);

    expect(playbackView.currentBeatDescriptors).toEqual([
      { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "dwarf" },
    ]);
    expect(playbackView.isFinished).toBe(false);
  });

  it("at the clash beat, currentBeatLines groups both ATTACKs and both DAMAGEs together", () => {
    const firstAttackEvent = resolvedBattle.events.find(
      (event) => event.type === "ATTACK",
    );
    const clashBeat = firstAttackEvent!.beatIndex;

    const playbackView = deriveBattlePlaybackState(
      resolvedBattle,
      clashBeat,
      clashBeat,
    );

    expect(playbackView.currentBeatDescriptors.length).toBe(4);
  });

  it("at the final beat, isFinished is true and the derived state matches a full manual reduce", () => {
    const playbackView = deriveBattlePlaybackState(
      resolvedBattle,
      highestBeat,
      highestBeat,
    );

    const manuallyReducedState = resolvedBattle.events.reduce(
      (state, event) => applyEvent(state, event),
      resolvedBattle.initialState,
    );

    expect(playbackView.isFinished).toBe(true);
    expect(playbackView.currentState).toEqual(manuallyReducedState);
  });

  // deliberate assertion rewrite: { kind: "battleStart" } before; { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "dwarf" } after — Phase 13
  it("viewing an earlier beat does not rewind the battle state", () => {
    const playbackView = deriveBattlePlaybackState(
      resolvedBattle,
      highestBeat,
      0,
    );

    const manuallyReducedState = resolvedBattle.events.reduce(
      (state, event) => applyEvent(state, event),
      resolvedBattle.initialState,
    );

    expect(playbackView.currentState).toEqual(manuallyReducedState);
    expect(playbackView.currentBeatDescriptors).toEqual([
      { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "dwarf" },
    ]);
  });

  it("at a clash beat, currentBeatType is CLASH", () => {
    const firstAttackEvent = resolvedBattle.events.find(
      (event) => event.type === "ATTACK",
    );
    const clashBeat = firstAttackEvent!.beatIndex;

    const playbackView = deriveBattlePlaybackState(
      resolvedBattle,
      clashBeat,
      clashBeat,
    );

    expect(playbackView.currentBeatType).toBe("CLASH");
  });

  it("at playbackBeat 0, currentBeatType is BATTLE_START", () => {
    const playbackView = deriveBattlePlaybackState(resolvedBattle, 0, 0);

    expect(playbackView.currentBeatType).toBe("BATTLE_START");
  });

  it("at playbackBeat -1, currentBeatType is undefined", () => {
    const playbackView = deriveBattlePlaybackState(resolvedBattle, -1, -1);

    expect(playbackView.currentBeatType).toBeUndefined();
  });

  it("currentBeatType follows playbackBeat, not viewingBeat, when scrubbing the log back", () => {
    const firstAttackEvent = resolvedBattle.events.find(
      (event) => event.type === "ATTACK",
    );
    const clashBeat = firstAttackEvent!.beatIndex;

    const playbackView = deriveBattlePlaybackState(
      resolvedBattle,
      clashBeat,
      0,
    );

    expect(playbackView.currentBeatType).toBe("CLASH");
  });

  // deliberate assertion rewrite: every effect gains abilityHpLost: 0 and isDropped: false (before: { isActing, armourGained, brokenFromArmour }; after: + abilityHpLost: 0, isDropped: false) — Phase 13
  it("DP-E1: exposes the playback beat's character effects", () => {
    const abilityPlayerCharacters: Character[] = [
      buildTestCharacter({ id: "p1", name: "Borin", attack: 2, hp: 3, maxHp: 3, armour: 0 }),
      buildTestCharacter({ id: "p2", name: "Ogden", attack: 3, hp: 8, maxHp: 8, armour: 0 }),
    ];
    const abilityEnemyCharacters: Character[] = [
      buildTestCharacter({ id: "e1", name: "Grukk", attack: 0, hp: 6, maxHp: 6, armour: 0 }),
    ];

    const abilityResolvedBattle: ResolvedBattle = {
      initialState: {
        player: { activeCharacters: abilityPlayerCharacters, downedCharacters: [] },
        enemy: { activeCharacters: abilityEnemyCharacters, downedCharacters: [] },
      },
      events: [
        { type: "BATTLE_START", playerFactionId: "dwarf", enemyFactionId: "dwarf", beatIndex: 0, beatType: "BATTLE_START" },
        {
          type: "ABILITY_ACTIVATE",
          characterId: "p2",
          abilityId: "tighten-those-straps-son",
          beatIndex: 1,
          beatType: "ABILITY",
        },
        {
          type: "STAT_CHANGE",
          targetId: "p1",
          stat: "armour",
          amount: 1,
          resultingValue: 1,
          source: "p2",
          sourceAbilityId: "tighten-those-straps-son",
          beatIndex: 1,
          beatType: "ABILITY",
        },
      ],
    };

    expect(
      [0, 1].map(
        (playbackBeat) =>
          deriveBattlePlaybackState(abilityResolvedBattle, playbackBeat, playbackBeat)
            .currentBeatCharacterEffects,
      ),
    ).toEqual([
      {},
      {
        p2: { isActing: true, armourGained: 0, brokenFromArmour: null, abilityHpLost: 0, isDropped: false },
        p1: { isActing: false, armourGained: 1, brokenFromArmour: null, abilityHpLost: 0, isDropped: false },
      },
    ]);
  });

  it("DP-N: the log's names come from the injected display name", () => {
    const playbackView = deriveBattlePlaybackState(
      resolvedBattle,
      highestBeat,
      highestBeat,
      (character) => `${character.name} (shown)`,
    );

    const firstAttackDescriptor = playbackView.allBeatDescriptors
      .flat()
      .find((descriptor) => descriptor.kind === "attack");

    expect(firstAttackDescriptor).toEqual({
      kind: "attack",
      // deliberate assertion rewrite: "Borin (shown)" → { name: "Borin (shown)", side: "player" } (Phase 14)
      attacker: { name: "Borin (shown)", side: "player" },
      // deliberate assertion rewrite: "Grukk (shown)" → { name: "Grukk (shown)", side: "enemy" } (Phase 14)
      target: { name: "Grukk (shown)", side: "enemy" },
    });
  });
});
