// Visual placeholder data only — NOT the real game schema.
// To be replaced when real game state exists. Do not build real logic on this shape.

import type { Character } from "@/lib/battle/types";

export const PLAYER_TEAM: Character[] = [
  { id: "player-1", name: "Borin", attack: 4, hp: 7, maxHp: 7 },
  { id: "player-2", name: "Thrudi", attack: 6, hp: 5, maxHp: 5 },
  { id: "player-3", name: "Gimlok", attack: 3, hp: 9, maxHp: 9 },
  { id: "player-4", name: "Fendra", attack: 8, hp: 4, maxHp: 4 },
  { id: "player-5", name: "Old Khaz", attack: 2, hp: 10, maxHp: 10 },
  { id: "player-6", name: "Bryndle", attack: 5, hp: 6, maxHp: 6 },
  { id: "player-7", name: "Wyrnstout", attack: 7, hp: 3, maxHp: 3 },
];

export const ENEMY_TEAM: Character[] = [
  { id: "enemy-1", name: "Grukk", attack: 5, hp: 6, maxHp: 6 },
  { id: "enemy-2", name: "Skarna", attack: 3, hp: 8, maxHp: 8 },
  { id: "enemy-3", name: "Mordek", attack: 9, hp: 2, maxHp: 2 },
  { id: "enemy-4", name: "Pell Ash", attack: 4, hp: 5, maxHp: 5 },
  { id: "enemy-5", name: "Ruskan", attack: 6, hp: 4, maxHp: 4 },
  { id: "enemy-6", name: "Vashka", attack: 2, hp: 9, maxHp: 9 },
  { id: "enemy-7", name: "Iron Cobb", attack: 7, hp: 5, maxHp: 5 },
];
