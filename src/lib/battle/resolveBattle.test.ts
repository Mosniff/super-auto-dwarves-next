import { describe, it, expect } from "vitest";
import { resolveBattle } from "./resolveBattle";
import { applyEvent } from "./applyEvent";
import type { BattleCharacter } from "./types";

describe("resolveBattle", () => {
  it("a one-sided lethal exchange ends in a win for the surviving side", () => {
    const playerCharacters: BattleCharacter[] = [
      { id: "p1", name: "Borin", attack: 5, hp: 10 },
    ];
    const enemyCharacters: BattleCharacter[] = [
      { id: "e1", name: "Grukk", attack: 2, hp: 3 },
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

    expect(events.at(-1)).toEqual({
      type: "BATTLE_END",
      outcome: "playerWin",
    });
  });

  it("a mutual-kill exchange ends in a draw with both characters dropped", () => {
    const playerCharacters: BattleCharacter[] = [
      { id: "p1", name: "Borin", attack: 5, hp: 3 },
    ];
    const enemyCharacters: BattleCharacter[] = [
      { id: "e1", name: "Grukk", attack: 5, hp: 3 },
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

    expect(events.at(-1)).toEqual({
      type: "BATTLE_END",
      outcome: "draw",
    });
  });

  it("a multi-turn battle continues after a front character drops and the next steps up", () => {
    const playerCharacters: BattleCharacter[] = [
      { id: "p1", name: "Borin", attack: 2, hp: 3 },
      { id: "p2", name: "Thrudi", attack: 4, hp: 5 },
    ];
    const enemyCharacters: BattleCharacter[] = [
      { id: "e1", name: "Grukk", attack: 2, hp: 6 },
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

    expect(events.at(-1)).toEqual({
      type: "BATTLE_END",
      outcome: "playerWin",
    });
  });

  it("a one-sided lethal exchange won by the enemy ends in enemyWin", () => {
    const playerCharacters: BattleCharacter[] = [
      { id: "p1", name: "Borin", attack: 2, hp: 3 },
    ];
    const enemyCharacters: BattleCharacter[] = [
      { id: "e1", name: "Grukk", attack: 5, hp: 10 },
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

    expect(events.at(-1)).toEqual({
      type: "BATTLE_END",
      outcome: "enemyWin",
    });
  });

  it("a zero-attack character deals no damage", () => {
    const playerCharacters: BattleCharacter[] = [
      { id: "p1", name: "Meek", attack: 0, hp: 5 },
    ];
    const enemyCharacters: BattleCharacter[] = [
      { id: "e1", name: "Grukk", attack: 3, hp: 4 },
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
    const playerCharacters: BattleCharacter[] = [
      { id: "p1", name: "Cursed", attack: -2, hp: 5 },
    ];
    const enemyCharacters: BattleCharacter[] = [
      { id: "e1", name: "Grukk", attack: 3, hp: 4 },
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
    const playerCharacters: BattleCharacter[] = [
      { id: "p1", name: "Borin", attack: 2, hp: 3 },
      { id: "p2", name: "Thrudi", attack: 4, hp: 5 },
    ];
    const enemyCharacters: BattleCharacter[] = [
      { id: "e1", name: "Grukk", attack: 2, hp: 6 },
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

  it(
    "a battle that never resolves is capped and ends in a draw",
    () => {
      const playerCharacters: BattleCharacter[] = [
        { id: "p1", name: "Pacifist", attack: 0, hp: 5 },
      ];
      const enemyCharacters: BattleCharacter[] = [
        { id: "e1", name: "Coward", attack: 0, hp: 5 },
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

      const turnStarts = events.filter(
        (event) => event.type === "TURN_START",
      );

      expect(turnStarts.length).toBe(3);
      expect(events.at(-1)).toEqual({
        type: "BATTLE_END",
        outcome: "draw",
      });
      expect(finalState.player.activeCharacters.length).toBe(1);
      expect(finalState.enemy.activeCharacters.length).toBe(1);
    },
    5000,
  );

  it(
    "a stalemate capped battle emits a TIMEOUT event before BATTLE_END",
    () => {
      const playerCharacters: BattleCharacter[] = [
        { id: "p1", name: "Pacifist", attack: 0, hp: 5 },
      ];
      const enemyCharacters: BattleCharacter[] = [
        { id: "e1", name: "Coward", attack: 0, hp: 5 },
      ];

      const { events } = resolveBattle(playerCharacters, enemyCharacters, 3);

      const timeoutEvents = events.filter(
        (event) => event.type === "TIMEOUT",
      );

      expect(timeoutEvents.length).toBe(1);
      expect(events.at(-2)).toEqual({ type: "TIMEOUT" });
      expect(events.at(-1)).toEqual({
        type: "BATTLE_END",
        outcome: "draw",
      });
    },
    5000,
  );

  it("a battle won on the cap turn does NOT emit a TIMEOUT event", () => {
    const playerCharacters: BattleCharacter[] = [
      { id: "p1", name: "Borin", attack: 1, hp: 10 },
    ];
    const enemyCharacters: BattleCharacter[] = [
      { id: "e1", name: "Grukk", attack: 1, hp: 3 },
    ];

    const { events } = resolveBattle(playerCharacters, enemyCharacters, 3);

    const timeoutEvents = events.filter((event) => event.type === "TIMEOUT");

    expect(timeoutEvents.length).toBe(0);
    expect(events.at(-1)).toEqual({
      type: "BATTLE_END",
      outcome: "playerWin",
    });
  });
});
