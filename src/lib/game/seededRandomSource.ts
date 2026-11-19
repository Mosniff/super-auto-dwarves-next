import type { ChooseRandomIndex } from "./chooseRandomIndex";

// A small seeded pseudo-random source (mulberry32) for anything that must
// replay identically: a battle is re-resolved on every load, advance and
// end-run from its stored battleSeed, so its randomness has to come from
// here, never from Math.random (Phase 13). Each call creates a fresh
// sequence from the seed; use one source per resolve. The algorithm is
// pinned by its tests — changing it would change the replay of every
// stored battle.
export function createSeededChooseRandomIndex(
  battleSeed: number,
): ChooseRandomIndex {
  let generatorState = battleSeed >>> 0;

  return (optionCount) => {
    if (!Number.isInteger(optionCount) || optionCount < 1) {
      throw new Error("optionCount must be a positive integer.");
    }

    generatorState = (generatorState + 0x6d2b79f5) >>> 0;
    let mixedBits = generatorState;
    mixedBits = Math.imul(mixedBits ^ (mixedBits >>> 15), mixedBits | 1);
    mixedBits ^= mixedBits + Math.imul(mixedBits ^ (mixedBits >>> 7), mixedBits | 61);
    const unitIntervalValue =
      ((mixedBits ^ (mixedBits >>> 14)) >>> 0) / 4294967296;

    return Math.floor(unitIntervalValue * optionCount);
  };
}
