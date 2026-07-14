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

interface BeatMetadata {
  // Groups events that should be presented together as one animation beat.
  // See CLAUDE.md → "Battle data architecture" → "Animation beats".
  beat: number;
}

// The event payloads (no beat) — used by the resolver when emitting.
// Discriminated union of logged state-change events. Starts minimal; grows per-test.
export type BattleEventPayload =
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
    }
  | {
      type: "TIMEOUT";
    };

// A logged event: a payload stamped with its beat.
export type BattleEvent = BattleEventPayload & BeatMetadata;

export interface ResolvedBattle {
  initialState: BattleState;
  events: BattleEvent[];
}
