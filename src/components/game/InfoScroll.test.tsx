// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import { InfoScroll } from "./InfoScroll";
import type { BattleEventDescriptor } from "@/lib/battle/types";

function renderInfoScroll(currentBeatDescriptors: BattleEventDescriptor[]) {
  return renderWithMessages(
    <InfoScroll
      currentBeatDescriptors={currentBeatDescriptors}
      onAdvance={() => {}}
      canAdvance={false}
      isFinished={false}
      onViewPreviousBeat={() => {}}
      onViewNextBeat={() => {}}
      canViewPrevious={false}
      canViewNext={false}
      isPlaying={false}
      onPlay={() => {}}
      onPause={() => {}}
    />,
  );
}

describe("InfoScroll", () => {
  it("renders an attack descriptor as interpolated English text", () => {
    renderInfoScroll([
      // deliberate input rewrite: name string → label (Phase 14)
      {
        kind: "attack",
        attacker: { name: "Borin", side: "player" },
        target: { name: "Grukk", side: "enemy" },
      },
    ]);

    // deliberate assertion rewrite: getByText → queryByText !== null, so a red fails on value; expected text unchanged (Phase 14)
    expect(screen.queryByText("Borin attacks Grukk") !== null).toBe(true);
  });

  it("renders a damage descriptor as interpolated English text", () => {
    renderInfoScroll([
      // deliberate input rewrite: name string → label (Phase 14)
      {
        kind: "damage",
        target: { name: "Grukk", side: "enemy" },
        amount: 4,
        resultingHp: 2,
      },
    ]);

    // deliberate assertion rewrite: getByText → queryByText !== null, so a red fails on value; expected text unchanged (Phase 14)
    expect(
      screen.queryByText("Grukk takes 4 damage (2 HP)") !== null,
    ).toBe(true);
  });

  it("renders a battleEnd playerWin descriptor as Victory!", () => {
    renderInfoScroll([{ kind: "battleEnd", outcome: "playerWin" }]);

    expect(screen.getByText("Victory!")).toBeInTheDocument();
  });

  it("shows the empty-state dash when there are no descriptors", () => {
    renderInfoScroll([]);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders an ability beat's battle cry and target line from the ability namespace", () => {
    renderInfoScroll([
      {
        kind: "abilityActivate",
        abilityId: "tighten-those-straps-son",
        // deliberate input rewrite: name string → label (Phase 14)
        character: { name: "Ogden", side: "player" },
      },
      {
        kind: "abilityStatChange",
        abilityId: "tighten-those-straps-son",
        // deliberate input rewrite: name string → label (Phase 14)
        target: { name: "Borin", side: "player" },
        stat: "armour",
        amount: 1,
        resultingValue: 2,
      },
    ]);

    expect([
      screen.queryByText('Ogden: "Tighten those straps!"') !== null,
      screen.queryByText("Borin gained 1 armour!") !== null,
    ]).toEqual([true, true]);
  });

  it("IS1: renders the battle-start line with both factions' plural names", () => {
    renderInfoScroll([
      { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "kobold" },
    ]);

    expect(
      screen.getByText("The dwarves and the kobolds prepare for battle"),
    ).toBeInTheDocument();
  });
});
