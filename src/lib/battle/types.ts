export interface BattleCharacter {
  id: string;
  name: string;
  attack: number;
  hp: number;
}

// A side's roster: contiguous, front-anchored. Index 0 is the front.
export type Roster = BattleCharacter[];

export interface BattleState {
  player: Roster;
  enemy: Roster;
}

// Discriminated union of logged state-change events. Starts minimal; grows per-test.
export type BattleEvent = {
  type: "DAMAGE";
  targetId: string;
  amount: number;
  resultingHp: number;
  source: string;
};
