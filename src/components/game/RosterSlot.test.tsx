// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages } from "@/test/renderWithMessages";
import { buildTestCharacter } from "@/test/characterFixtures";
import type { BeatCharacterEffect } from "@/lib/battle/beatCharacterEffects";
import { RosterSlot } from "./RosterSlot";

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

function effectFlashes(): string[] {
  return Array.from(
    document.querySelectorAll("[data-roster-slot-effect-flash]"),
  ).map((flash) => flash.getAttribute("data-roster-slot-effect-flash") ?? "");
}

describe("RosterSlot hit flashes", () => {
  it("RS1: a bench card that loses hp to an ability shows one hpHit flash", () => {
    renderWithMessages(
      <RosterSlot
        character={buildTestCharacter({ id: "rs1" })}
        beatEffect={buildBeatEffect({ abilityHpLost: 2 })}
        beatKey={4}
      />,
    );

    expect(effectFlashes()).toEqual(["hpHit"]);
  });

  it("RS2: a card with no beat effect shows no flash", () => {
    renderWithMessages(
      <RosterSlot character={buildTestCharacter({ id: "rs2" })} beatKey={4} />,
    );

    expect(effectFlashes()).toEqual([]);
  });

  it("RS3: an armour hit shows an armourHit flash and the shield's struck beat", () => {
    renderWithMessages(
      <RosterSlot
        character={buildTestCharacter({ id: "rs3", armour: 2 })}
        beatEffect={buildBeatEffect({ armourLost: 1 })}
        beatKey={4}
      />,
    );

    expect([
      effectFlashes(),
      document
        .querySelector("[data-armour-beat]")
        ?.getAttribute("data-armour-beat") ?? null,
    ]).toEqual([["armourHit"], "struck"]);
  });

  it("RS4: the same hit on the next beat flashes again (a new flash element)", () => {
    const character = buildTestCharacter({ id: "rs4" });
    const { rerender } = renderWithMessages(
      <RosterSlot
        character={character}
        beatEffect={buildBeatEffect({ abilityHpLost: 1 })}
        beatKey={4}
      />,
    );
    const firstFlash = document.querySelector("[data-roster-slot-effect-flash]");

    rerender(
      <RosterSlot
        character={character}
        beatEffect={buildBeatEffect({ abilityHpLost: 1 })}
        beatKey={5}
      />,
    );
    const secondFlash = document.querySelector("[data-roster-slot-effect-flash]");

    expect([
      firstFlash !== null,
      secondFlash !== null,
      firstFlash === secondFlash,
    ]).toEqual([true, true, false]);
  });

  it("RS5: a bench card that gains armour shows a buff flash", () => {
    renderWithMessages(
      <RosterSlot
        character={buildTestCharacter({ id: "rs5", armour: 1 })}
        beatEffect={buildBeatEffect({ armourGained: 1 })}
        beatKey={4}
      />,
    );

    expect(effectFlashes()).toEqual(["buff"]);
  });
});
