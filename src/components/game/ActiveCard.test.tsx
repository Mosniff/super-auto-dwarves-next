// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages } from "@/test/renderWithMessages";
import { buildTestCharacter } from "@/test/characterFixtures";
import type { BeatCharacterEffect } from "@/lib/battle/beatCharacterEffects";
import { ActiveCard } from "./ActiveCard";

function buildBeatEffect(
  overrides: Partial<BeatCharacterEffect>,
): BeatCharacterEffect {
  return {
    isActing: false,
    armourGained: 0,
    brokenFromArmour: null,
    hpLost: 0,
    armourLost: 0,
    dealsAbilityHit: false,
    isDropped: false,
    ...overrides,
  };
}

function frontCardFlashes(): string[] {
  return Array.from(
    document.querySelectorAll("[data-active-card-effect-flash]"),
  ).map((flash) => flash.getAttribute("data-active-card-effect-flash") ?? "");
}

describe("ActiveCard hit flashes", () => {
  it("AF1: a front card hit in a clash that loses hp shows one hpHit flash", () => {
    const character = buildTestCharacter({ id: "af1" });
    renderWithMessages(
      <ActiveCard
        character={character}
        currentBeatType="CLASH"
        currentBeat={{
          beatKey: 7,
          beatType: "CLASH",
          characterEffects: { af1: buildBeatEffect({ hpLost: 3 }) },
        }}
      />,
    );

    expect(frontCardFlashes()).toEqual(["hpHit"]);
  });

  it("AF2: a front card whose armour takes the hit flashes armourHit; one that gains armour flashes buff", () => {
    function flashFor(beatEffect: BeatCharacterEffect): string[] {
      const { unmount } = renderWithMessages(
        <ActiveCard
          character={buildTestCharacter({ id: "af2", armour: 2 })}
          currentBeatType="ABILITY"
          currentBeat={{
            beatKey: 3,
            beatType: "ABILITY",
            characterEffects: { af2: beatEffect },
          }}
        />,
      );
      const flashes = frontCardFlashes();
      unmount();
      return flashes;
    }

    expect([
      flashFor(buildBeatEffect({ armourLost: 1 })),
      flashFor(buildBeatEffect({ armourGained: 1 })),
    ]).toEqual([["armourHit"], ["buff"]]);
  });

  it("AF3: a front card with no beat effect shows no flash", () => {
    renderWithMessages(
      <ActiveCard
        character={buildTestCharacter({ id: "af3" })}
        currentBeatType="CLASH"
        currentBeat={{ beatKey: 7, beatType: "CLASH", characterEffects: {} }}
      />,
    );

    expect(frontCardFlashes()).toEqual([]);
  });
});
