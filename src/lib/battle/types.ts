export interface BattleCharacter {
  id: string;
  name: string;
  attack: number;
  hp: number;
}

export interface Roster {
  // contiguous, front-anchored fighting line; index 0 is the front
  activeCharacters: BattleCharacter[];
  // this side's dropped characters (graveyard)
  downedCharacters: BattleCharacter[];
}

export interface BattleState {
  player: Roster;
  enemy: Roster;
}

// Discriminated union of logged state-change events. Starts minimal; grows per-test.
export type BattleEvent =
  | {
      type: "DAMAGE";
      targetId: string;
      amount: number;
      resultingHp: number;
      source: string;
    }
  | {
      type: "DROP";
      characterId: string;
    }
  | {
      type: "ATTACK";
      attackerId: string;
      targetId: string;
      value: number;
    }
  | {
      type: "BATTLE_START";
    }
  | {
      type: "BATTLE_END";
      outcome: "playerWin" | "enemyWin" | "draw";
    }
  | {
      type: "TURN_START";
      turn: number;
    };
