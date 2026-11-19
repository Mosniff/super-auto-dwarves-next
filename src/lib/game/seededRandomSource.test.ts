import { describe, it, expect } from "vitest";
import { MAX_BATTLE_SEED } from "./enemyEncounter";
import { createSeededChooseRandomIndex } from "./seededRandomSource";

function drawSequence(
  battleSeed: number,
  optionCount: number,
  drawCount: number,
): number[] {
  const chooseRandomIndex = createSeededChooseRandomIndex(battleSeed);

  return Array.from({ length: drawCount }, () => chooseRandomIndex(optionCount));
}

describe("createSeededChooseRandomIndex", () => {
  it("SR1: the algorithm is pinned: known sequences for seeds 1, 2, 0 and 2^32 - 1", () => {
    expect({
      seedOne: drawSequence(1, 100, 8),
      seedTwo: drawSequence(2, 100, 8),
      seedZero: drawSequence(0, 100, 4),
      maxSeed: drawSequence(MAX_BATTLE_SEED, 100, 4),
    }).toEqual({
      seedOne: [62, 0, 52, 98, 96, 28, 61, 72],
      seedTwo: [73, 32, 28, 53, 87, 63, 49, 35],
      seedZero: [26, 0, 22, 14],
      maxSeed: [89, 18, 71, 94],
    });
  });

  it("SR2: two sources from the same seed replay the same sequence", () => {
    expect(drawSequence(12345, 7, 50)).toEqual(drawSequence(12345, 7, 50));
  });

  it("SR3: every draw is an integer from 0 to optionCount - 1", () => {
    const chooseRandomIndex = createSeededChooseRandomIndex(99);
    const outOfRangeDraws = [1, 2, 3, 7].flatMap((optionCount) =>
      Array.from({ length: 500 }, () => chooseRandomIndex(optionCount)).filter(
        (drawnIndex) =>
          !Number.isInteger(drawnIndex) ||
          drawnIndex < 0 ||
          drawnIndex >= optionCount,
      ),
    );

    expect(outOfRangeDraws).toEqual([]);
  });

  it("SR4: draws spread evenly: 7000 draws over 7 options land 800 to 1200 times each", () => {
    const drawCounts = Array.from({ length: 7 }, () => 0);

    for (const drawnIndex of drawSequence(2026, 7, 7000)) {
      drawCounts[drawnIndex] += 1;
    }

    expect(
      drawCounts.map((drawCount) => drawCount >= 800 && drawCount <= 1200),
    ).toEqual([true, true, true, true, true, true, true]);
  });

  it("SR5: throws for an optionCount that is not a positive integer", () => {
    const chooseRandomIndex = createSeededChooseRandomIndex(1);

    expect(
      [0, -1, 1.5, Number.NaN].map((optionCount) => {
        try {
          chooseRandomIndex(optionCount);
          return false;
        } catch {
          return true;
        }
      }),
    ).toEqual([true, true, true, true]);
  });
});
