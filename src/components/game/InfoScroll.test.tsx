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

function logLineTexts() {
  return [...document.querySelectorAll("li")].map(
    (logLine) => logLine.textContent,
  );
}

function logHighlights() {
  return [...document.querySelectorAll("li [data-highlight]")].map(
    (highlightElement) => ({
      highlight: highlightElement.getAttribute("data-highlight"),
      side: highlightElement.getAttribute("data-side"),
      text: highlightElement.textContent,
    }),
  );
}

function logLinePresentations() {
  return [...document.querySelectorAll("li")].map((logLine) => ({
    icon: logLine.getAttribute("data-log-line-icon"),
    emphasis: logLine.getAttribute("data-log-line-emphasis"),
    side: logLine.getAttribute("data-log-line-side"),
  }));
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

    // deliberate assertion rewrite: whole log lines via textContent, since highlight spans split the text; expected text unchanged (Phase 14)
    expect(logLineTexts()).toEqual(["Borin attacks Grukk"]);
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

    // deliberate assertion rewrite: whole log lines via textContent, since highlight spans split the text; expected text unchanged (Phase 14)
    expect(logLineTexts()).toEqual(["Grukk takes 4 damage (2 HP)"]);
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

    // deliberate assertion rewrite: whole log lines via textContent, since highlight spans split the text; expected text unchanged (Phase 14)
    expect(logLineTexts()).toEqual([
      'Ogden: "Tighten those straps!"',
      "Borin gained 1 armour!",
    ]);
  });

  it("IS1: renders the battle-start line with both factions' plural names", () => {
    renderInfoScroll([
      { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "kobold" },
    ]);

    expect(
      screen.getByText("The dwarves and the kobolds prepare for battle"),
    ).toBeInTheDocument();
  });

  it("IH1: an attack line highlights both names, coloured by side", () => {
    renderInfoScroll([
      {
        kind: "attack",
        attacker: { name: "Borin", side: "player" },
        target: { name: "Grukk", side: "enemy" },
      },
    ]);

    expect(logHighlights()).toEqual([
      { highlight: "character", side: "player", text: "Borin" },
      { highlight: "character", side: "enemy", text: "Grukk" },
    ]);
  });

  it("IH2: a damage line highlights the target and both numbers", () => {
    renderInfoScroll([
      {
        kind: "damage",
        target: { name: "Grukk", side: "enemy" },
        amount: 4,
        resultingHp: 2,
      },
    ]);

    expect(logHighlights()).toEqual([
      { highlight: "character", side: "enemy", text: "Grukk" },
      { highlight: "number", side: null, text: "4" },
      { highlight: "number", side: null, text: "2" },
    ]);
  });

  it("IH3: ability lines highlight the caster, the target and the amount", () => {
    renderInfoScroll([
      {
        kind: "abilityActivate",
        abilityId: "tighten-those-straps-son",
        character: { name: "Ogden", side: "player" },
      },
      {
        kind: "abilityStatChange",
        abilityId: "tighten-those-straps-son",
        target: { name: "Borin", side: "player" },
        stat: "armour",
        amount: 1,
        resultingValue: 2,
      },
    ]);

    expect(logHighlights()).toEqual([
      { highlight: "character", side: "player", text: "Ogden" },
      { highlight: "character", side: "player", text: "Borin" },
      { highlight: "number", side: null, text: "1" },
    ]);
  });

  it("IL1: each line carries its icon, emphasis and side as data attributes", () => {
    renderInfoScroll([
      {
        kind: "attack",
        attacker: { name: "Grukk", side: "enemy" },
        target: { name: "Borin", side: "player" },
      },
      {
        kind: "damage",
        target: { name: "Borin", side: "player" },
        amount: 2,
        resultingHp: 3,
      },
    ]);

    expect(logLinePresentations()).toEqual([
      { icon: "swords", emphasis: "line", side: "enemy" },
      { icon: "damage", emphasis: "line", side: "player" },
    ]);
  });

  it("IL2: a turn line is a heading and an outcome line is emphasised, with no icon or side", () => {
    renderInfoScroll([
      { kind: "turnStart", turn: 3 },
      { kind: "battleEnd", outcome: "enemyWin" },
    ]);

    expect(logLinePresentations()).toEqual([
      { icon: null, emphasis: "turnHeading", side: null },
      { icon: null, emphasis: "outcome", side: null },
    ]);
  });
});
