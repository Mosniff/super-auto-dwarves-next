import type { Character } from "@/lib/game/character";
import type { CharacterAbilityId } from "@/lib/game/characterAbilities";

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
  | "ENGAGE"
  | "TURN_START"
  | "CLASH"
  | "DROP"
  | "TIMEOUT"
  | "BATTLE_END"
  | "ABILITY";

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
      type: "ARMOUR_DAMAGE";
      targetId: string;
      amount: number;
      resultingArmour: number;
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
  // No state change: the fronts step into the action zone on this beat
  // (presentation, step 11b). Emitted only when both sides still have
  // fighters after the battle-start sub-phases.
  | {
      type: "FRONTS_ENGAGE";
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
    }
  | {
      type: "ABILITY_ACTIVATE";
      characterId: string;
      abilityId: CharacterAbilityId;
    }
  // An outcome event: carries the resulting value, so applyEvent only
  // assigns it. Only armour exists as a stat for now; others join the
  // union when an ability needs them.
  | {
      type: "STAT_CHANGE";
      targetId: string;
      stat: "armour";
      amount: number;
      resultingValue: number;
      source: string;
      sourceAbilityId: CharacterAbilityId;
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
  | { kind: "frontsEngage" }
  | { kind: "turnStart"; turn: number }
  | { kind: "attack"; attacker: string; target: string }
  | { kind: "damage"; target: string; amount: number; resultingHp: number }
  | {
      kind: "armourDamage";
      target: string;
      amount: number;
      resultingArmour: number;
    }
  | { kind: "drop"; character: string }
  | { kind: "timeout" }
  | { kind: "battleEnd"; outcome: "playerWin" | "enemyWin" | "draw" }
  | { kind: "abilityActivate"; abilityId: CharacterAbilityId; character: string }
  | {
      kind: "abilityStatChange";
      abilityId: CharacterAbilityId;
      target: string;
      stat: "armour";
      amount: number;
      resultingValue: number;
    };
