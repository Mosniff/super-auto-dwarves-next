// Battle autoplay speeds (Phase 14). parseAutoplaySpeed reads a stored
// preference back, defaulting to off for anything it doesn't recognise.
export const AUTOPLAY_SPEEDS = ["off", "slow", "fast"] as const;
export type AutoplaySpeed = (typeof AUTOPLAY_SPEEDS)[number];

export function parseAutoplaySpeed(storedValue: string | null): AutoplaySpeed {
  return (
    AUTOPLAY_SPEEDS.find((autoplaySpeed) => autoplaySpeed === storedValue) ??
    "off"
  );
}
