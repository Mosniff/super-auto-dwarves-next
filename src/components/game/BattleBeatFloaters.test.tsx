// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages } from "@/test/renderWithMessages";
import type { BeatCharacterEffect } from "@/lib/battle/beatCharacterEffects";
import { BattleBeatFloaters } from "./BattleBeatFloaters";

function buildBeatEffect(
  overrides: Partial<BeatCharacterEffect>,
): BeatCharacterEffect {
  return {
    isActing: false,
    armourGained: 0,
    brokenFromArmour: null,
    abilityHpLost: 0,
    armourLost: 0,
    isDropped: false,
    ...overrides,
  };
}

function renderedFloaters(): [string | null, string | null][] {
  return [...document.querySelectorAll("[data-battle-beat-floater]")].map(
    (floater) => [
      floater.getAttribute("data-battle-beat-floater"),
      floater.textContent,
    ],
  );
}

describe("BattleBeatFloaters", () => {
  it("HF1: an ability hit shows a \u2212N HP floater", () => {
    renderWithMessages(
      <BattleBeatFloaters
        beatEffect={buildBeatEffect({ abilityHpLost: 2 })}
        beatKey={3}
      />,
    );

    expect(renderedFloaters()).toEqual([["abilityHpLoss", "\u22122 HP"]]);
  });

  it("HF2: a beat with no ability hp loss shows no hp floater", () => {
    renderWithMessages(
      <BattleBeatFloaters
        beatEffect={buildBeatEffect({ isDropped: true })}
        beatKey={4}
      />,
    );

    expect(renderedFloaters()).toEqual([]);
  });
});
