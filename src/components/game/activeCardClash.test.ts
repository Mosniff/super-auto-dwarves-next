import { describe, it, expect } from "vitest";
import { clashKeyframes } from "./activeCardClash";

describe("clashKeyframes", () => {
  it("CK1: the player's card (facing right) pulls back left, lunges right, overshoots back and settles, as percentages of its own width", () => {
    expect(clashKeyframes("right")).toEqual({
      xOffsets: ["0%", "-62.5%", "20.8%", "-2.8%", "0%"],
      rotationDegrees: [0, -15, 5, 0, 0],
    });
  });

  it("CK2: the enemy's card (facing left) is the mirror image", () => {
    expect(clashKeyframes("left")).toEqual({
      xOffsets: ["0%", "62.5%", "-20.8%", "2.8%", "0%"],
      rotationDegrees: [0, 15, -5, 0, 0],
    });
  });
});
