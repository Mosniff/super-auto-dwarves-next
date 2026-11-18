import { describe, it, expect } from "vitest";
import { resolveBattle } from "./resolveBattle";
import { applyEvent } from "./applyEvent";
import type { Character } from "@/lib/game/character";
import { buildTestCharacter } from "@/test/characterFixtures";
import type { BattleStartAbilityPlanner } from "./battleStartAbilities";

describe("resolveBattle", () => {
  it("a one-sided lethal exchange ends in a win for the surviving side", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({ id: "p1", name: "Borin", attack: 5, hp: 10, maxHp: 10, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];
    const enemyCharacters: Character[] = [
      buildTestCharacter({ id: "e1", name: "Grukk", attack: 2, hp: 3, maxHp: 3, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];

    const { initialState, events } = resolveBattle(
      playerCharacters,
      enemyCharacters,
    );

    const finalState = events.reduce(
      (state, event) => applyEvent(state, event),
      initialState,
    );

    expect(finalState.enemy.activeCharacters.length).toBe(0);
    expect(finalState.enemy.downedCharacters.length).toBe(1);
    expect(finalState.enemy.downedCharacters[0].id).toBe("e1");
    expect(finalState.player.activeCharacters.length).toBe(1);
    expect(finalState.player.activeCharacters[0].id).toBe("p1");
    expect(finalState.player.activeCharacters[0].hp).toBe(8);

    expect(events.at(-1)).toMatchObject({
      type: "BATTLE_END",
      outcome: "playerWin",
    });
  });

  it("a mutual-kill exchange ends in a draw with both characters dropped", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({ id: "p1", name: "Borin", attack: 5, hp: 3, maxHp: 3, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];
    const enemyCharacters: Character[] = [
      buildTestCharacter({ id: "e1", name: "Grukk", attack: 5, hp: 3, maxHp: 3, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];

    const { initialState, events } = resolveBattle(
      playerCharacters,
      enemyCharacters,
    );

    const finalState = events.reduce(
      (state, event) => applyEvent(state, event),
      initialState,
    );

    expect(finalState.player.activeCharacters.length).toBe(0);
    expect(finalState.enemy.activeCharacters.length).toBe(0);
    expect(finalState.player.downedCharacters.length).toBe(1);
    expect(finalState.player.downedCharacters[0].id).toBe("p1");
    expect(finalState.enemy.downedCharacters.length).toBe(1);
    expect(finalState.enemy.downedCharacters[0].id).toBe("e1");

    expect(events.at(-1)).toMatchObject({
      type: "BATTLE_END",
      outcome: "draw",
    });

    const dropEvents = events.filter((event) => event.type === "DROP");
    const clashEvents = events.filter(
      (event) => event.type === "ATTACK" || event.type === "DAMAGE",
    );

    expect(dropEvents.length).toBe(2);
    expect(dropEvents[0].beatIndex).toBe(dropEvents[1].beatIndex);
    expect(dropEvents[0].beatIndex).toBeGreaterThan(clashEvents[0].beatIndex);
  });

  it("a multi-turn battle continues after a front character drops and the next steps up", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({ id: "p1", name: "Borin", attack: 2, hp: 3, maxHp: 3, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
      buildTestCharacter({ id: "p2", name: "Thrudi", attack: 4, hp: 5, maxHp: 5, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];
    const enemyCharacters: Character[] = [
      buildTestCharacter({ id: "e1", name: "Grukk", attack: 2, hp: 6, maxHp: 6, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];

    const { initialState, events } = resolveBattle(
      playerCharacters,
      enemyCharacters,
    );

    const finalState = events.reduce(
      (state, event) => applyEvent(state, event),
      initialState,
    );

    expect(finalState.enemy.activeCharacters.length).toBe(0);
    expect(finalState.enemy.downedCharacters.length).toBe(1);
    expect(finalState.enemy.downedCharacters[0].id).toBe("e1");
    expect(finalState.player.activeCharacters.length).toBe(1);
    expect(finalState.player.activeCharacters[0].id).toBe("p2");
    expect(finalState.player.activeCharacters[0].hp).toBe(3);
    expect(finalState.player.downedCharacters.length).toBe(1);
    expect(finalState.player.downedCharacters[0].id).toBe("p1");

    expect(events.at(-1)).toMatchObject({
      type: "BATTLE_END",
      outcome: "playerWin",
    });

    const attackEvents = events.filter((event) => event.type === "ATTACK");
    const damageEvents = events.filter((event) => event.type === "DAMAGE");
    const turnStartEvents = events.filter(
      (event) => event.type === "TURN_START",
    );

    // Turn 1's clash: both ATTACKs and both DAMAGEs share one beat.
    expect(attackEvents[0].beatIndex).toBe(attackEvents[1].beatIndex);
    expect(damageEvents[0].beatIndex).toBe(attackEvents[0].beatIndex);
    expect(damageEvents[1].beatIndex).toBe(attackEvents[0].beatIndex);

    // TURN_START opens its own, earlier beat before that turn's clash.
    expect(turnStartEvents[0].beatIndex).toBeLessThan(
      attackEvents[0].beatIndex,
    );
  });

  it("a one-sided lethal exchange won by the enemy ends in enemyWin", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({ id: "p1", name: "Borin", attack: 2, hp: 3, maxHp: 3, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];
    const enemyCharacters: Character[] = [
      buildTestCharacter({ id: "e1", name: "Grukk", attack: 5, hp: 10, maxHp: 10, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];

    const { initialState, events } = resolveBattle(
      playerCharacters,
      enemyCharacters,
    );

    const finalState = events.reduce(
      (state, event) => applyEvent(state, event),
      initialState,
    );

    expect(finalState.player.activeCharacters.length).toBe(0);
    expect(finalState.player.downedCharacters.length).toBe(1);
    expect(finalState.player.downedCharacters[0].id).toBe("p1");
    expect(finalState.enemy.activeCharacters.length).toBe(1);
    expect(finalState.enemy.activeCharacters[0].id).toBe("e1");
    expect(finalState.enemy.activeCharacters[0].hp).toBe(8);

    expect(events.at(-1)).toMatchObject({
      type: "BATTLE_END",
      outcome: "enemyWin",
    });
  });

  it("a zero-attack character deals no damage", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({ id: "p1", name: "Meek", attack: 0, hp: 5, maxHp: 5, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];
    const enemyCharacters: Character[] = [
      buildTestCharacter({ id: "e1", name: "Grukk", attack: 3, hp: 4, maxHp: 4, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];

    const { events } = resolveBattle(playerCharacters, enemyCharacters);

    const firstDamageToGrukk = events.find(
      (event) => event.type === "DAMAGE" && event.targetId === "e1",
    );

    expect(firstDamageToGrukk).toMatchObject({
      amount: 0,
      resultingHp: 4,
    });
  });

  it("a negative-attack character deals no damage and does not heal the target", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({ id: "p1", name: "Cursed", attack: -2, hp: 5, maxHp: 5, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];
    const enemyCharacters: Character[] = [
      buildTestCharacter({ id: "e1", name: "Grukk", attack: 3, hp: 4, maxHp: 4, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];

    const { events } = resolveBattle(playerCharacters, enemyCharacters);

    const firstDamageToGrukk = events.find(
      (event) => event.type === "DAMAGE" && event.targetId === "e1",
    );

    expect(firstDamageToGrukk).toMatchObject({
      amount: 0,
      resultingHp: 4,
    });
  });

  it("the resolver emits a TURN_START event at the start of each turn, numbered from 1", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({ id: "p1", name: "Borin", attack: 2, hp: 3, maxHp: 3, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
      buildTestCharacter({ id: "p2", name: "Thrudi", attack: 4, hp: 5, maxHp: 5, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];
    const enemyCharacters: Character[] = [
      buildTestCharacter({ id: "e1", name: "Grukk", attack: 2, hp: 6, maxHp: 6, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];

    const { events } = resolveBattle(playerCharacters, enemyCharacters);

    const turnStarts = events.filter((event) => event.type === "TURN_START");

    expect(turnStarts.length).toBe(3);
    expect(turnStarts.map((event) => event.turn)).toEqual([1, 2, 3]);

    const firstTurnStartIndex = events.findIndex(
      (event) => event.type === "TURN_START",
    );
    const firstAttackIndex = events.findIndex(
      (event) => event.type === "ATTACK",
    );

    expect(firstTurnStartIndex).toBeLessThan(firstAttackIndex);
  });

  it("a battle that never resolves is capped and ends in a draw", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({ id: "p1", name: "Pacifist", attack: 0, hp: 5, maxHp: 5, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];
    const enemyCharacters: Character[] = [
      buildTestCharacter({ id: "e1", name: "Coward", attack: 0, hp: 5, maxHp: 5, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];

    const { initialState, events } = resolveBattle(
      playerCharacters,
      enemyCharacters,
      3,
    );

    const finalState = events.reduce(
      (state, event) => applyEvent(state, event),
      initialState,
    );

    const turnStarts = events.filter((event) => event.type === "TURN_START");

    expect(turnStarts.length).toBe(3);
    expect(events.at(-1)).toMatchObject({
      type: "BATTLE_END",
      outcome: "draw",
    });
    expect(finalState.player.activeCharacters.length).toBe(1);
    expect(finalState.enemy.activeCharacters.length).toBe(1);
  }, 5000);

  it("a stalemate capped battle emits a TIMEOUT event before BATTLE_END", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({ id: "p1", name: "Pacifist", attack: 0, hp: 5, maxHp: 5, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];
    const enemyCharacters: Character[] = [
      buildTestCharacter({ id: "e1", name: "Coward", attack: 0, hp: 5, maxHp: 5, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];

    const { events } = resolveBattle(playerCharacters, enemyCharacters, 3);

    const timeoutEvents = events.filter((event) => event.type === "TIMEOUT");

    expect(timeoutEvents.length).toBe(1);
    expect(events.at(-2)).toMatchObject({ type: "TIMEOUT" });
    expect(events.at(-1)).toMatchObject({
      type: "BATTLE_END",
      outcome: "draw",
    });
  }, 5000);

  it("a battle won on the cap turn does NOT emit a TIMEOUT event", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({ id: "p1", name: "Borin", attack: 1, hp: 10, maxHp: 10, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];
    const enemyCharacters: Character[] = [
      buildTestCharacter({ id: "e1", name: "Grukk", attack: 1, hp: 3, maxHp: 3, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];

    const { events } = resolveBattle(playerCharacters, enemyCharacters, 3);

    const timeoutEvents = events.filter((event) => event.type === "TIMEOUT");

    expect(timeoutEvents.length).toBe(0);
    expect(events.at(-1)).toMatchObject({
      type: "BATTLE_END",
      outcome: "playerWin",
    });
  });

  it("stamps every event with the beatType matching the kind of moment it belongs to", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({ id: "p1", name: "Borin", attack: 5, hp: 10, maxHp: 10, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];
    const enemyCharacters: Character[] = [
      buildTestCharacter({ id: "e1", name: "Grukk", attack: 2, hp: 3, maxHp: 3, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
    ];

    const { events } = resolveBattle(playerCharacters, enemyCharacters);

    const battleStartEvents = events.filter(
      (event) => event.type === "BATTLE_START",
    );
    const turnStartEvents = events.filter(
      (event) => event.type === "TURN_START",
    );
    const attackEvents = events.filter((event) => event.type === "ATTACK");
    const damageEvents = events.filter((event) => event.type === "DAMAGE");
    const dropEvents = events.filter((event) => event.type === "DROP");
    const battleEndEvents = events.filter(
      (event) => event.type === "BATTLE_END",
    );

    expect(battleStartEvents.length).toBeGreaterThan(0);
    expect(turnStartEvents.length).toBeGreaterThan(0);
    expect(attackEvents.length).toBeGreaterThan(0);
    expect(damageEvents.length).toBeGreaterThan(0);
    expect(dropEvents.length).toBeGreaterThan(0);
    expect(battleEndEvents.length).toBeGreaterThan(0);

    for (const event of battleStartEvents) {
      expect(event.beatType).toBe("BATTLE_START");
    }
    for (const event of turnStartEvents) {
      expect(event.beatType).toBe("TURN_START");
    }
    for (const event of attackEvents) {
      expect(event.beatType).toBe("CLASH");
    }
    for (const event of damageEvents) {
      expect(event.beatType).toBe("CLASH");
    }
    for (const event of dropEvents) {
      expect(event.beatType).toBe("DROP");
    }
    for (const event of battleEndEvents) {
      expect(event.beatType).toBe("BATTLE_END");
    }
  });

  it("R1: hits on armour emit ARMOUR_DAMAGE instead of DAMAGE", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({
        id: "p1",
        name: "Borin",
        attack: 2,
        hp: 10,
        maxHp: 10,
        armour: 1,
      }),
    ];
    const enemyCharacters: Character[] = [
      buildTestCharacter({
        id: "e1",
        name: "Grukk",
        attack: 0,
        hp: 5,
        maxHp: 5,
        armour: 3,
      }),
    ];

    const { events } = resolveBattle(playerCharacters, enemyCharacters, 1);

    const hitEvents = events.filter(
      (event) => event.type === "DAMAGE" || event.type === "ARMOUR_DAMAGE",
    );

    expect(hitEvents).toEqual([
      {
        type: "ARMOUR_DAMAGE",
        targetId: "e1",
        amount: 2,
        resultingArmour: 1,
        source: "p1",
        beatIndex: 2,
        beatType: "CLASH",
      },
      {
        type: "ARMOUR_DAMAGE",
        targetId: "p1",
        amount: 0,
        resultingArmour: 1,
        source: "e1",
        beatIndex: 2,
        beatType: "CLASH",
      },
    ]);
  });

  it("R2: a hit that breaks armour discards the rest: hp untouched and no drop", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({
        id: "p1",
        name: "Borin",
        attack: 5,
        hp: 10,
        maxHp: 10,
        armour: 0,
      }),
    ];
    const enemyCharacters: Character[] = [
      buildTestCharacter({
        id: "e1",
        name: "Grukk",
        attack: 0,
        hp: 3,
        maxHp: 3,
        armour: 2,
      }),
    ];

    const { initialState, events } = resolveBattle(
      playerCharacters,
      enemyCharacters,
      1,
    );

    const hitEvents = events.filter(
      (event) => event.type === "DAMAGE" || event.type === "ARMOUR_DAMAGE",
    );
    const hitsOnEnemy = hitEvents.filter((event) => event.targetId === "e1");
    const dropEvents = events.filter((event) => event.type === "DROP");

    const finalState = events.reduce(
      (state, event) => applyEvent(state, event),
      initialState,
    );
    const enemyAfterBattle = finalState.enemy.activeCharacters.map(
      (character) => ({
        id: character.id,
        hp: character.hp,
        armour: character.armour,
      }),
    );

    expect({ hitsOnEnemy, dropEvents, enemyAfterBattle }).toEqual({
      hitsOnEnemy: [
        {
          type: "ARMOUR_DAMAGE",
          targetId: "e1",
          amount: 2,
          resultingArmour: 0,
          source: "p1",
          beatIndex: 2,
          beatType: "CLASH",
        },
      ],
      dropEvents: [],
      enemyAfterBattle: [{ id: "e1", hp: 3, armour: 0 }],
    });
  });

  it("R3: once armour is broken, the next hit damages hp", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({
        id: "p1",
        name: "Borin",
        attack: 5,
        hp: 10,
        maxHp: 10,
        armour: 0,
      }),
    ];
    const enemyCharacters: Character[] = [
      buildTestCharacter({
        id: "e1",
        name: "Grukk",
        attack: 0,
        hp: 3,
        maxHp: 3,
        armour: 2,
      }),
    ];

    const { events } = resolveBattle(playerCharacters, enemyCharacters, 2);

    const hitEvents = events.filter(
      (event) => event.type === "DAMAGE" || event.type === "ARMOUR_DAMAGE",
    );
    const hitsOnEnemy = hitEvents.filter((event) => event.targetId === "e1");

    expect({ hitsOnEnemy, lastEvent: events.at(-1) }).toEqual({
      hitsOnEnemy: [
        {
          type: "ARMOUR_DAMAGE",
          targetId: "e1",
          amount: 2,
          resultingArmour: 0,
          source: "p1",
          beatIndex: 2,
          beatType: "CLASH",
        },
        {
          type: "DAMAGE",
          targetId: "e1",
          amount: 5,
          resultingHp: -2,
          source: "p1",
          beatIndex: 4,
          beatType: "CLASH",
        },
      ],
      lastEvent: {
        type: "BATTLE_END",
        outcome: "playerWin",
        beatIndex: 6,
        beatType: "BATTLE_END",
      },
    });
  });

  // The O-tests below deliberately use the real Ogden template and the
  // real Tighten Those Straps Son ability data (not fixtures), so they
  // also prove the whole path from template to resolver.
  function buildFixtureOgden(
    id: string,
    experienceForLevel: number,
  ): Character {
    return buildTestCharacter({
      id,
      name: "Ogden",
      characterTemplateId: "ogden",
      attack: 3,
      hp: 8,
      maxHp: 8,
      armour: 0,
      experience: experienceForLevel,
    });
  }

  function buildFixtureGrukk(id: string): Character {
    return buildTestCharacter({
      id,
      name: "Grukk",
      attack: 0,
      hp: 20,
      maxHp: 20,
      armour: 0,
      characterTemplateId: "fixture-dwarf",
      tier: 1,
      characterClassIds: ["warrior"],
      experience: 0,
    });
  }

  function abilityBeatEventsOf(events: ReturnType<typeof resolveBattle>["events"]) {
    return events.filter((event) => event.beatType === "ABILITY");
  }

  it("O1: a level-1 Ogden behind Borin gives Borin 1 armour in his own beat, straight after the prepare beat", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({
        id: "p1",
        name: "Borin",
        characterTemplateId: "fixture-dwarf",
        tier: 1,
        characterClassIds: ["warrior"],
        attack: 2,
        hp: 10,
        maxHp: 10,
        armour: 0,
        experience: 0,
      }),
      buildFixtureOgden("p2", 0),
    ];
    const enemyCharacters: Character[] = [buildFixtureGrukk("e1")];

    const { events } = resolveBattle(playerCharacters, enemyCharacters, 1);

    expect({
      abilityBeatEvents: abilityBeatEventsOf(events),
      firstTurnBeat: events.find((event) => event.type === "TURN_START")
        ?.beatIndex,
    }).toEqual({
      abilityBeatEvents: [
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
      firstTurnBeat: 2,
    });
  });

  it("O2: two Ogdens stack: targets come from the snapshot, resulting armour from the current state", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({
        id: "p1",
        name: "Borin",
        characterTemplateId: "fixture-dwarf",
        tier: 1,
        characterClassIds: ["warrior"],
        attack: 2,
        hp: 10,
        maxHp: 10,
        armour: 0,
        experience: 0,
      }),
      buildFixtureOgden("p2", 0),
      buildFixtureOgden("p3", 3),
    ];
    const enemyCharacters: Character[] = [buildFixtureGrukk("e1")];

    const { events } = resolveBattle(playerCharacters, enemyCharacters, 1);

    expect(
      events
        .filter((event) => event.type === "STAT_CHANGE")
        .map((event) => [event.targetId, event.resultingValue, event.beatIndex]),
    ).toEqual([
      ["p1", 1, 1],
      ["p1", 2, 2],
      ["p2", 1, 2],
    ]);
  });

  it("O3: a level-1 Ogden at the front shouts but has no effect", () => {
    const playerCharacters: Character[] = [
      buildFixtureOgden("p1", 0),
      buildTestCharacter({
        id: "p2",
        name: "Borin",
        characterTemplateId: "fixture-dwarf",
        tier: 1,
        characterClassIds: ["warrior"],
        attack: 2,
        hp: 10,
        maxHp: 10,
        armour: 0,
        experience: 0,
      }),
    ];
    const enemyCharacters: Character[] = [buildFixtureGrukk("e1")];

    const { events } = resolveBattle(playerCharacters, enemyCharacters, 1);

    expect(abilityBeatEventsOf(events).map((event) => event.type)).toEqual([
      "ABILITY_ACTIVATE",
    ]);
  });

  it("O4: a level-4 Ogden with only one ally ahead targets just that ally", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({
        id: "p1",
        name: "Borin",
        characterTemplateId: "fixture-dwarf",
        tier: 1,
        characterClassIds: ["warrior"],
        attack: 2,
        hp: 10,
        maxHp: 10,
        armour: 0,
        experience: 0,
      }),
      buildFixtureOgden("p2", 10),
    ];
    const enemyCharacters: Character[] = [buildFixtureGrukk("e1")];

    const { events } = resolveBattle(playerCharacters, enemyCharacters, 1);

    expect(
      events
        .filter((event) => event.type === "STAT_CHANGE")
        .map((event) => event.targetId),
    ).toEqual(["p1"]);
  });

  it("O5: a level-5 Ogden buffs the whole party including himself, front to back", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({
        id: "p1",
        name: "Borin",
        characterTemplateId: "fixture-dwarf",
        tier: 1,
        characterClassIds: ["warrior"],
        attack: 2,
        hp: 10,
        maxHp: 10,
        armour: 0,
        experience: 0,
      }),
      buildFixtureOgden("p2", 15),
      buildTestCharacter({
        id: "p3",
        name: "Borin",
        characterTemplateId: "fixture-dwarf",
        tier: 1,
        characterClassIds: ["warrior"],
        attack: 2,
        hp: 10,
        maxHp: 10,
        armour: 0,
        experience: 0,
      }),
    ];
    const enemyCharacters: Character[] = [buildFixtureGrukk("e1")];

    const { events } = resolveBattle(playerCharacters, enemyCharacters, 1);

    expect(
      events
        .filter((event) => event.type === "STAT_CHANGE")
        .map((event) => [event.targetId, event.resultingValue]),
    ).toEqual([
      ["p1", 1],
      ["p2", 1],
      ["p3", 1],
    ]);
  });

  it("O6: beat order: player front to back, then enemy front to back", () => {
    const playerCharacters: Character[] = [
      buildFixtureOgden("p1", 0),
      buildFixtureOgden("p2", 0),
    ];
    const enemyCharacters: Character[] = [
      buildFixtureOgden("e1", 0),
      buildFixtureOgden("e2", 0),
    ];

    const { events } = resolveBattle(playerCharacters, enemyCharacters, 1);

    expect(
      events
        .filter((event) => event.type === "ABILITY_ACTIVATE")
        .map((event) => [event.characterId, event.beatIndex]),
    ).toEqual([
      ["p1", 1],
      ["p2", 2],
      ["e1", 3],
      ["e2", 4],
    ]);
  });

  it("D1: two pre-battle damagers both fire, both hit, and drop together at the end of the phase", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({
        id: "p1",
        name: "Archer A",
        attack: 0,
        hp: 3,
        maxHp: 3,
        armour: 0,
      }),
    ];
    const enemyCharacters: Character[] = [
      buildTestCharacter({
        id: "e1",
        name: "Archer B",
        attack: 0,
        hp: 3,
        maxHp: 3,
        armour: 0,
      }),
    ];

    // abilityId is a stand-in; no real damage ability exists yet.
    const fixturePlanner: BattleStartAbilityPlanner = (context) => {
      if (context.actor.id === "p1") {
        return {
          abilityId: "tighten-those-straps-son" as const,
          effects: [
            { effectKind: "damage" as const, targetId: "e1", amount: 5 },
          ],
        };
      }
      if (context.actor.id === "e1") {
        return {
          abilityId: "tighten-those-straps-son" as const,
          effects: [
            { effectKind: "damage" as const, targetId: "p1", amount: 5 },
          ],
        };
      }
      return null;
    };

    const { events } = resolveBattle(
      playerCharacters,
      enemyCharacters,
      20,
      fixturePlanner,
    );

    expect({
      beats: events.map((event) => [
        event.beatIndex,
        event.beatType,
        event.type,
      ]),
      outcome: events.at(-1),
    }).toEqual({
      beats: [
        [0, "BATTLE_START", "BATTLE_START"],
        [1, "ABILITY", "ABILITY_ACTIVATE"],
        [1, "ABILITY", "DAMAGE"],
        [2, "ABILITY", "ABILITY_ACTIVATE"],
        [2, "ABILITY", "DAMAGE"],
        [3, "DROP", "DROP"],
        [3, "DROP", "DROP"],
        [4, "BATTLE_END", "BATTLE_END"],
      ],
      outcome: {
        type: "BATTLE_END",
        outcome: "draw",
        beatIndex: 4,
        beatType: "BATTLE_END",
      },
    });
  });

  it("D2: ability damage goes through resolveHit, so armour takes it first", () => {
    const playerCharacters: Character[] = [
      buildTestCharacter({
        id: "p1",
        name: "Fixture Dwarf",
        attack: 0,
        hp: 5,
        maxHp: 5,
        armour: 0,
      }),
    ];
    const enemyCharacters: Character[] = [
      buildTestCharacter({
        id: "e1",
        name: "Grukk",
        attack: 0,
        hp: 5,
        maxHp: 5,
        armour: 3,
      }),
    ];

    const fixturePlanner: BattleStartAbilityPlanner = (context) => {
      if (context.actor.id === "p1") {
        return {
          abilityId: "tighten-those-straps-son",
          effects: [{ effectKind: "damage", targetId: "e1", amount: 2 }],
        };
      }
      return null;
    };

    const { events } = resolveBattle(
      playerCharacters,
      enemyCharacters,
      1,
      fixturePlanner,
    );

    expect(
      events
        .filter((event) => event.beatIndex === 1)
        .map(({ beatIndex, beatType, ...payload }) => payload),
    ).toEqual([
      {
        type: "ABILITY_ACTIVATE",
        characterId: "p1",
        abilityId: "tighten-those-straps-son",
      },
      {
        type: "ARMOUR_DAMAGE",
        targetId: "e1",
        amount: 2,
        resultingArmour: 1,
        source: "p1",
      },
    ]);
  });
});
