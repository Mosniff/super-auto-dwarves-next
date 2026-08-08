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
      { kind: "attack", attacker: "Borin", target: "Grukk" },
    ]);

    expect(screen.getByText("Borin attacks Grukk")).toBeInTheDocument();
  });

  it("renders a damage descriptor as interpolated English text", () => {
    renderInfoScroll([
      { kind: "damage", target: "Grukk", amount: 4, resultingHp: 2 },
    ]);

    expect(
      screen.getByText("Grukk takes 4 damage (2 HP)"),
    ).toBeInTheDocument();
  });

  it("renders a battleEnd playerWin descriptor as Victory!", () => {
    renderInfoScroll([{ kind: "battleEnd", outcome: "playerWin" }]);

    expect(screen.getByText("Victory!")).toBeInTheDocument();
  });

  it("shows the empty-state dash when there are no descriptors", () => {
    renderInfoScroll([]);

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
