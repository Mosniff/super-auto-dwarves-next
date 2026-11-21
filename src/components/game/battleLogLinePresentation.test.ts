import { describe, it, expect } from "vitest";
import type { BattleEventDescriptor } from "@/lib/battle/types";
import { battleLogLinePresentation } from "./battleLogLinePresentation";

const borin = { name: "Borin", side: "player" } as const;
const grukk = { name: "Grukk", side: "enemy" } as const;

describe("battleLogLinePresentation", () => {
  it("LP1: battle-flow lines have no side; the turn is a heading and the outcome is emphasised", () => {
    const descriptors: BattleEventDescriptor[] = [
      { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "kobold" },
      { kind: "frontsEngage" },
      { kind: "turnStart", turn: 3 },
      { kind: "timeout" },
      { kind: "battleEnd", outcome: "playerWin" },
    ];

    expect(descriptors.map(battleLogLinePresentation)).toEqual([
      { icon: "flag", emphasis: "line", markerSide: null },
      { icon: "swords", emphasis: "line", markerSide: null },
      { icon: null, emphasis: "turnHeading", markerSide: null },
      { icon: "timeout", emphasis: "line", markerSide: null },
      { icon: null, emphasis: "outcome", markerSide: null },
    ]);
  });

  it("LP2: combat lines take their icon from the kind and their side from the first-named character", () => {
    const descriptors: BattleEventDescriptor[] = [
      { kind: "attack", attacker: grukk, target: borin },
      { kind: "damage", target: borin, amount: 2, resultingHp: 3 },
      { kind: "armourDamage", target: grukk, amount: 1, resultingArmour: 1 },
      { kind: "armourDamage", target: grukk, amount: 1, resultingArmour: 0 },
      { kind: "drop", character: grukk },
    ];

    expect(descriptors.map(battleLogLinePresentation)).toEqual([
      { icon: "swords", emphasis: "line", markerSide: "enemy" },
      { icon: "damage", emphasis: "line", markerSide: "player" },
      { icon: "armour", emphasis: "line", markerSide: "enemy" },
      { icon: "armourBreak", emphasis: "line", markerSide: "enemy" },
      { icon: "drop", emphasis: "line", markerSide: "enemy" },
    ]);
  });

  it("LP3: ability lines: the battle cry sparkles; its effects show as damage or armour on the target", () => {
    const descriptors: BattleEventDescriptor[] = [
      { kind: "abilityActivate", abilityId: "yip-strike", character: grukk },
      { kind: "abilityDamage", abilityId: "yip-strike", target: borin, amount: 1 },
      {
        kind: "abilityStatChange",
        abilityId: "tighten-those-straps-son",
        target: borin,
        stat: "armour",
        amount: 1,
        resultingValue: 1,
      },
    ];

    expect(descriptors.map(battleLogLinePresentation)).toEqual([
      { icon: "ability", emphasis: "line", markerSide: "enemy" },
      { icon: "damage", emphasis: "line", markerSide: "player" },
      { icon: "armour", emphasis: "line", markerSide: "player" },
    ]);
  });
});
