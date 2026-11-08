import { describe, it, expect } from "vitest";
import { CHARACTER_CLASS_IDS, isCharacterClassId } from "./characterClasses";

describe("characterClasses", () => {
  it("C1: CHARACTER_CLASS_IDS equals the full class id list, in order", () => {
    expect(CHARACTER_CLASS_IDS).toEqual([
      "warrior",
      "mage",
      "merchant",
      "smith",
      "miner",
    ]);
  });

  it("C2: isCharacterClassId accepts every known class id", () => {
    expect(
      ["warrior", "mage", "merchant", "smith", "miner"].map(
        isCharacterClassId,
      ),
    ).toEqual([true, true, true, true, true]);
  });

  it("C3: isCharacterClassId rejects non-class-id values", () => {
    expect(
      ["Warrior", "", "rogue", 1, null, undefined, {}].map(
        isCharacterClassId,
      ),
    ).toEqual([false, false, false, false, false, false, false]);
  });
});
