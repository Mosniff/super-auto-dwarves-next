import { describe, it, expect } from "vitest";
import { resolveHit } from "./resolveHit";
import { buildTestCharacter } from "@/test/characterFixtures";

describe("resolveHit", () => {
  it("H1: a hit on a target with no armour damages hp", () => {
    const target = buildTestCharacter({
      id: "e1",
      name: "Grukk",
      attack: 0,
      hp: 7,
      maxHp: 7,
      armour: 0,
    });

    expect(resolveHit(target, 3, "p1")).toEqual({
      type: "DAMAGE",
      targetId: "e1",
      amount: 3,
      resultingHp: 4,
      source: "p1",
    });
  });

  it("H2: a hit smaller than the armour lowers the armour and leaves hp alone", () => {
    const target = buildTestCharacter({
      id: "e1",
      name: "Grukk",
      attack: 0,
      hp: 7,
      maxHp: 7,
      armour: 3,
    });

    expect(resolveHit(target, 2, "p1")).toEqual({
      type: "ARMOUR_DAMAGE",
      targetId: "e1",
      amount: 2,
      resultingArmour: 1,
      source: "p1",
    });
  });

  it("H3: a hit at least the armour breaks it to 0 and the rest is discarded", () => {
    const target = buildTestCharacter({
      id: "e1",
      name: "Grukk",
      attack: 0,
      hp: 7,
      maxHp: 7,
      armour: 2,
    });

    expect(
      [5, 2].map((damageValue) => resolveHit(target, damageValue, "p1")),
    ).toEqual([
      {
        type: "ARMOUR_DAMAGE",
        targetId: "e1",
        amount: 2,
        resultingArmour: 0,
        source: "p1",
      },
      {
        type: "ARMOUR_DAMAGE",
        targetId: "e1",
        amount: 2,
        resultingArmour: 0,
        source: "p1",
      },
    ]);
  });

  it("H4: a 0-damage hit against armour leaves it unchanged", () => {
    const target = buildTestCharacter({
      id: "e1",
      name: "Grukk",
      attack: 0,
      hp: 7,
      maxHp: 7,
      armour: 2,
    });

    expect(resolveHit(target, 0, "p1")).toEqual({
      type: "ARMOUR_DAMAGE",
      targetId: "e1",
      amount: 0,
      resultingArmour: 2,
      source: "p1",
    });
  });
});
