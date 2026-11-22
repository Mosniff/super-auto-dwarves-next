// The player's battle autoplay speed, remembered in browser storage
// (Phase 14). A browser-side UI preference only, never game state: the
// server stays the source of truth for the game.
import {
  parseAutoplaySpeed,
  type AutoplaySpeed,
} from "@/lib/battle/autoplaySpeed";

export const AUTOPLAY_SPEED_STORAGE_KEY = "super-auto-dwarves:battle-autoplay-speed";

export function readAutoplaySpeedPreference(): AutoplaySpeed {
  try {
    return parseAutoplaySpeed(
      window.localStorage.getItem(AUTOPLAY_SPEED_STORAGE_KEY),
    );
  } catch {
    return "off";
  }
}

export function writeAutoplaySpeedPreference(autoplaySpeed: AutoplaySpeed): void {
  try {
    window.localStorage.setItem(AUTOPLAY_SPEED_STORAGE_KEY, autoplaySpeed);
  } catch {
    // storage unavailable: the choice just isn't remembered
  }
}
