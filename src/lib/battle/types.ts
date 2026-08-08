export interface Character {
  id: string;
  name: string;
  attack: number;
  hp: number;
  // full-health ceiling; current hp never exceeds this
  maxHp: number;
}

export interface Roster {
  // contiguous, front-anchored fighting line; index 0 is the front
  activeCharacters: Character[];
  // this side's dropped characters (graveyard)
  downedCharacters: Character[];
}

export interface BattleState {
  player: Roster;
  enemy: Roster;
}

export type BeatType =
  | "BATTLE_START"
  | "TURN_START"
  | "CLASH"
  | "DROP"
  | "TIMEOUT"
  | "BATTLE_END";

interface BeatMetadata {
  // Groups events that should be presented together as one animation beat.
  // See CLAUDE.md → "Battle data architecture" → "Animation beats".
  beatIndex: number;
  // which kind of beat this event belongs to; stamped by the resolver
  beatType: BeatType;
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

// Structured, language-agnostic descriptors for the battle log — one per
// BattleEvent kind, carrying only the resolved params a future per-locale
// message layer needs. Keyed on `kind` (not `type`) to stay visually
// distinct from BattleEventPayload's discriminant.
export type BattleEventDescriptor =
  | { kind: "battleStart" }
  | { kind: "turnStart"; turn: number }
  | { kind: "attack"; attacker: string; target: string }
  | { kind: "damage"; target: string; amount: number; resultingHp: number }
  | { kind: "drop"; character: string }
  | { kind: "timeout" }
  | { kind: "battleEnd"; outcome: "playerWin" | "enemyWin" | "draw" };
