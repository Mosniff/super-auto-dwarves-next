// Visual placeholder data only — NOT the real game schema.
// To be replaced when real game state exists. Do not build real logic on this shape.

export interface DummyCharacter {
  id: string;
  name: string;
  attack: number;
  health: number;
}

export const PLAYER_TEAM: DummyCharacter[] = [
  { id: "player-1", name: "Borin", attack: 4, health: 7 },
  { id: "player-2", name: "Thrudi", attack: 6, health: 5 },
  { id: "player-3", name: "Gimlok", attack: 3, health: 9 },
  { id: "player-4", name: "Fendra", attack: 8, health: 4 },
  { id: "player-5", name: "Old Khaz", attack: 2, health: 10 },
  { id: "player-6", name: "Bryndle", attack: 5, health: 6 },
  { id: "player-7", name: "Wyrnstout", attack: 7, health: 3 },
];

export const ENEMY_TEAM: DummyCharacter[] = [
  { id: "enemy-1", name: "Grukk", attack: 5, health: 6 },
  { id: "enemy-2", name: "Skarna", attack: 3, health: 8 },
  { id: "enemy-3", name: "Mordek", attack: 9, health: 2 },
  { id: "enemy-4", name: "Pell Ash", attack: 4, health: 5 },
  { id: "enemy-5", name: "Ruskan", attack: 6, health: 4 },
  { id: "enemy-6", name: "Vashka", attack: 2, health: 9 },
  { id: "enemy-7", name: "Iron Cobb", attack: 7, health: 5 },
];

// Index of the currently-active character on each side (for later stages)
export const PLAYER_ACTIVE_INDEX = 0;
export const ENEMY_ACTIVE_INDEX = 0;
