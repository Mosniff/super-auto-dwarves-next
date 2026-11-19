import { describe, it, expect } from "vitest";
import type { Character } from "@/lib/game/character";
import { buildTestCharacter } from "@/test/characterFixtures";
import {
  BATTLE_START_SUB_PHASES,
  planBattleStartAbility,
} from "./battleStartAbilities";

const thief: Character = buildTestCharacter({
  id: "thief",
  characterTemplateId: "kobold-thief",
  characterFactionId: "kobold",
  attack: 2,
  hp: 3,
  maxHp: 3,
});

describe("planBattleStartAbility", () => {
  it("BS1: the sub-phases run buffs, then damage", () => {
    expect([...BATTLE_START_SUB_PHASES]).toEqual([
      "onBattleStartBuffs",
      "onBattleStartDamage",
    ]);
  });

  it("BS2: Yip Strike picks only among opponents whose snapshot hp is above 0", () => {
    const receivedOptionCounts: number[] = [];

    const plan = planBattleStartAbility({
      subPhase: "onBattleStartDamage",
      actor: thief,
      actorIndex: 0,
      allies: [thief],
      opponents: [
        buildTestCharacter({ id: "fallen", hp: 0 }),
        buildTestCharacter({ id: "standing", hp: 5 }),
      ],
      chooseRandomIndex: (optionCount) => {
        receivedOptionCounts.push(optionCount);
        return 0;
      },
    });

    expect({ plan, receivedOptionCounts }).toEqual({
      plan: {
        abilityId: "yip-strike",
        effects: [{ effectKind: "damage", targetId: "standing", amount: 1 }],
      },
      receivedOptionCounts: [1],
    });
  });

  it("BS3: with no standing opponent, or in the buffs sub-phase, Yip Strike plans nothing", () => {
    expect([
      planBattleStartAbility({
        subPhase: "onBattleStartDamage",
        actor: thief,
        actorIndex: 0,
        allies: [thief],
        opponents: [buildTestCharacter({ id: "fallen", hp: 0 })],
        chooseRandomIndex: () => 0,
      }),
      planBattleStartAbility({
        subPhase: "onBattleStartBuffs",
        actor: thief,
        actorIndex: 0,
        allies: [thief],
        opponents: [buildTestCharacter({ id: "standing", hp: 5 })],
        chooseRandomIndex: () => 0,
      }),
    ]).toEqual([null, null]);
  });
});
