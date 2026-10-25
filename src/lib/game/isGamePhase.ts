import type { GamePhase } from "./types";

// Validates a phase value arriving from untrusted input, such as a browser
// form field, before it reaches server logic.
export function isGamePhase(value: unknown): value is GamePhase {
  return value === "campPhase" || value === "battlePhase";
}
