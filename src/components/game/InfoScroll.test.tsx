// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import { InfoScroll } from "./InfoScroll";
import type { BattleEventDescriptor } from "@/lib/battle/types";

// mechanical fixture extension: optional viewed turn and beat (Phase 14)
function renderInfoScroll(
  currentBeatDescriptors: BattleEventDescriptor[],
  viewedPosition: { viewedTurn?: number; viewedBeat?: number } = {},
) {
  return renderWithMessages(
    <InfoScroll
      {...viewedPosition}
      currentBeatDescriptors={currentBeatDescriptors}
      onViewPreviousBeat={() => {}}
      onViewNextBeat={() => {}}
      canViewPrevious={false}
      canViewNext={false}
      isPlaying={false}
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

function turnHeader() {
  const turnHeaderElement = document.querySelector(
    "[data-info-scroll-turn-header]",
  );
  return turnHeaderElement === null
    ? null
    : {
        kind: turnHeaderElement.getAttribute("data-info-scroll-turn-header"),
        text: turnHeaderElement.textContent,
      };
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
      // deliberate assertion rewrite: emphasis "turnHeading" → "turnBegins" (the turn-start beat's big line, Phase 14)
      { icon: null, emphasis: "turnBegins", side: null },
      { icon: null, emphasis: "outcome", side: null },
    ]);
  });

  it("TH1: during a turn, the header at the top shows the viewed turn", () => {
    renderInfoScroll(
      [
        {
          kind: "attack",
          attacker: { name: "Borin", side: "player" },
          target: { name: "Grukk", side: "enemy" },
        },
      ],
      { viewedTurn: 3, viewedBeat: 8 },
    );

    expect(turnHeader()).toEqual({ kind: "turn", text: "Turn 3" });
  });

  it("TH2: before turn 1, the header reads Pre-battle", () => {
    renderInfoScroll([{ kind: "frontsEngage" }], {
      viewedTurn: 0,
      viewedBeat: 1,
    });

    expect(turnHeader()).toEqual({ kind: "preBattle", text: "Pre-battle" });
  });

  it("TH3: on a turn-start beat the header hides and the big turn-begins line fills the scroll", () => {
    renderInfoScroll([{ kind: "turnStart", turn: 3 }], {
      viewedTurn: 3,
      viewedBeat: 7,
    });

    expect({
      header: turnHeader(),
      lines: logLineTexts(),
      emphasis: logLinePresentations().map(
        (presentation) => presentation.emphasis,
      ),
    }).toEqual({
      header: null,
      lines: ["Turn 3 begins!"],
      emphasis: ["turnBegins"],
    });
  });

  it("TH4: on the outcome beat the header hides and only the result shows", () => {
    renderInfoScroll([{ kind: "battleEnd", outcome: "playerWin" }], {
      viewedTurn: 3,
      viewedBeat: 10,
    });

    expect({ header: turnHeader(), lines: logLineTexts() }).toEqual({
      header: null,
      lines: ["Victory!"],
    });
  });

  it("SE1: each new viewed beat re-mounts the lines, so they slide in again", () => {
    const attackDescriptors: BattleEventDescriptor[] = [
      {
        kind: "attack",
        attacker: { name: "Borin", side: "player" },
        target: { name: "Grukk", side: "enemy" },
      },
    ];
    const { rerender } = renderInfoScroll(attackDescriptors, {
      viewedTurn: 1,
      viewedBeat: 3,
    });
    const lineBefore = document.querySelector("li");

    rerender(
      <InfoScroll
        currentBeatDescriptors={attackDescriptors}
        onViewPreviousBeat={() => {}}
        onViewNextBeat={() => {}}
        canViewPrevious={false}
        canViewNext={false}
        isPlaying={false}
        viewedTurn={2}
        viewedBeat={5}
      />,
    );

    expect(document.querySelector("li") === lineBefore).toBe(false);
  });

  it("SE2: lines carry their stagger index, capped at 4 so a long beat still finishes in time", () => {
    renderInfoScroll(
      [1, 2, 3, 4, 5, 6].map((amount) => ({
        kind: "abilityDamage" as const,
        abilityId: "yip-strike" as const,
        target: { name: "Grukk", side: "enemy" as const },
        amount,
      })),
      { viewedTurn: 1, viewedBeat: 3 },
    );

    expect(
      [...document.querySelectorAll("li")].map((logLine) =>
        logLine.getAttribute("data-log-line-index"),
      ),
    ).toEqual(["0", "1", "2", "3", "4", "4"]);
  });
});
