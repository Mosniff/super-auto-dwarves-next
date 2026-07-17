import { describe, it, expect } from "vitest";
import { applyEvent } from "./applyEvent";
import type { BattleState, BattleEvent } from "./types";

describe("applyEvent", () => {
  it("DAMAGE updates an enemy target's hp to resultingHp", () => {
    const state: BattleState = {
      player: {
        activeCharacters: [
          { id: "p1", name: "Borin", attack: 4, hp: 7, maxHp: 7 },
        ],
        downedCharacters: [],
      },
      enemy: {
        activeCharacters: [
          { id: "e1", name: "Grukk", attack: 5, hp: 6, maxHp: 6 },
        ],
        downedCharacters: [],
      },
    };

    const event: BattleEvent = {
      type: "DAMAGE",
      targetId: "e1",
      amount: 4,
      resultingHp: 2,
      source: "p1",
      beatIndex: 0,
    };

    const result = applyEvent(state, event);

    expect(result.enemy.activeCharacters[0].hp).toBe(2);
  });

  it("DAMAGE updates a player target's hp to resultingHp", () => {
    const state: BattleState = {
      player: {
        activeCharacters: [
          { id: "p1", name: "Borin", attack: 4, hp: 7, maxHp: 7 },
        ],
        downedCharacters: [],
      },
      enemy: {
        activeCharacters: [
          { id: "e1", name: "Grukk", attack: 5, hp: 6, maxHp: 6 },
        ],
        downedCharacters: [],
      },
    };

    const event: BattleEvent = {
      type: "DAMAGE",
      targetId: "p1",
      amount: 5,
      resultingHp: 2,
      source: "e1",
      beatIndex: 0,
    };

    const result = applyEvent(state, event);

    expect(result.player.activeCharacters[0].hp).toBe(2);
  });

  it("DAMAGE leaves all non-target characters unchanged", () => {
    const state: BattleState = {
      player: {
        activeCharacters: [
          { id: "p1", name: "Borin", attack: 4, hp: 7, maxHp: 7 },
          { id: "p2", name: "Thrudi", attack: 6, hp: 5, maxHp: 5 },
        ],
        downedCharacters: [],
      },
      enemy: {
        activeCharacters: [
          { id: "e1", name: "Grukk", attack: 5, hp: 6, maxHp: 6 },
          { id: "e2", name: "Skarna", attack: 3, hp: 8, maxHp: 8 },
        ],
        downedCharacters: [],
      },
    };

    const event: BattleEvent = {
      type: "DAMAGE",
      targetId: "e1",
      amount: 4,
      resultingHp: 2,
      source: "p1",
      beatIndex: 0,
    };

    const result = applyEvent(state, event);

    expect(result.enemy.activeCharacters[0].hp).toBe(2);
    expect(result.player.activeCharacters[0].hp).toBe(7);
    expect(result.player.activeCharacters[1].hp).toBe(5);
    expect(result.enemy.activeCharacters[1].hp).toBe(8);
  });

  it("DROP removes the character from activeCharacters and moves it to that side's downedCharacters", () => {
    const state: BattleState = {
      player: {
        activeCharacters: [
          { id: "p1", name: "Borin", attack: 4, hp: 7, maxHp: 7 },
          { id: "p2", name: "Thrudi", attack: 6, hp: 5, maxHp: 5 },
        ],
        downedCharacters: [],
      },
      enemy: {
        activeCharacters: [
          { id: "e1", name: "Grukk", attack: 5, hp: 6, maxHp: 6 },
        ],
        downedCharacters: [],
      },
    };

    const event: BattleEvent = {
      type: "DROP",
      characterId: "p1",
      beatIndex: 0,
    };

    const result = applyEvent(state, event);

    expect(result.player.activeCharacters.length).toBe(1);
    expect(result.player.activeCharacters[0].id).toBe("p2");
    expect(result.player.downedCharacters.length).toBe(1);
    expect(result.player.downedCharacters[0].id).toBe("p1");
    expect(result.enemy.activeCharacters.length).toBe(1);
    expect(result.enemy.downedCharacters.length).toBe(0);
  });

  describe("state-no-op events", () => {
    const state: BattleState = {
      player: {
        activeCharacters: [
          { id: "p1", name: "Borin", attack: 4, hp: 7, maxHp: 7 },
        ],
        downedCharacters: [],
      },
      enemy: {
        activeCharacters: [
          { id: "e1", name: "Grukk", attack: 5, hp: 6, maxHp: 6 },
        ],
        downedCharacters: [],
      },
    };

    it("ATTACK does not change state", () => {
      const event: BattleEvent = {
        type: "ATTACK",
        attackerId: "p1",
        targetId: "e1",
        value: 4,
        beatIndex: 0,
      };

      const result = applyEvent(state, event);

      expect(result).toEqual(state);
    });

    it("BATTLE_START does not change state", () => {
      const event: BattleEvent = {
        type: "BATTLE_START",
        beatIndex: 0,
      };

      const result = applyEvent(state, event);

      expect(result).toEqual(state);
    });

    it("BATTLE_END does not change state", () => {
      const event: BattleEvent = {
        type: "BATTLE_END",
        outcome: "playerWin",
        beatIndex: 0,
      };

      const result = applyEvent(state, event);

      expect(result).toEqual(state);
    });

    it("TURN_START does not change state", () => {
      const event: BattleEvent = {
        type: "TURN_START",
        turn: 1,
        beatIndex: 0,
      };

      const result = applyEvent(state, event);

      expect(result).toEqual(state);
    });

    it("TIMEOUT does not change state", () => {
      const event: BattleEvent = {
        type: "TIMEOUT",
        beatIndex: 0,
      };

      const result = applyEvent(state, event);

      expect(result).toEqual(state);
    });
  });
});
