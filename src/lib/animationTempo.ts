// The app's one animation speed setting (Phase 15, the human's): every
// animation time and beat length is a base value times this; above 1 is
// slower. Beats and the animations inside them scale together, so
// animations still fit their beats. The CSS reads the same value through
// --animation-tempo (set from this constant by the root layout, from
// block T2).
export const ANIMATION_TEMPO = 1.25;

export function animationTempoMs(baseMilliseconds: number): number {
  return Math.round(baseMilliseconds * ANIMATION_TEMPO);
}

export function animationTempoSeconds(baseSeconds: number): number {
  return baseSeconds * ANIMATION_TEMPO;
}
