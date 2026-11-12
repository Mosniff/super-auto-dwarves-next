// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import type { GamePhase } from "@/lib/game/types";
import { useReportPhaseAdvanceAvailability } from "@/components/game/phaseAdvanceAvailability";
import { GameScreen } from "./GameScreen";
import { PhaseAdvanceButton } from "./PhaseAdvanceButton";

function ReportingScreen({
  gamePhase,
  isAvailable,
}: {
  gamePhase: GamePhase;
  isAvailable: boolean;
}) {
  useReportPhaseAdvanceAvailability(gamePhase, isAvailable);
  return <p>screen</p>;
}

describe("PhaseAdvanceButton", () => {
  it("(o) camp: enabled once the camp screen reports it's allowed, and its form carries the camp phase", () => {
    renderWithMessages(
      <GameScreen
        phase="campPhase"
        header={
          <PhaseAdvanceButton
            gamePhase="campPhase"
            advanceGameAction={async () => {}}
          />
        }
      >
        <ReportingScreen gamePhase="campPhase" isAvailable={true} />
      </GameScreen>,
    );

    const toBattleButton = screen.getByRole("button", { name: "To battle" });
    expect(toBattleButton).toBeEnabled();

    const form = toBattleButton.closest("form");
    expect(form).not.toBeNull();
    expect(
      new FormData(form as HTMLFormElement).get("expectedCurrentPhase"),
    ).toBe("campPhase");
  });

  it("(p) camp: disabled while the camp screen reports it's not allowed", () => {
    renderWithMessages(
      <GameScreen
        phase="campPhase"
        header={
          <PhaseAdvanceButton
            gamePhase="campPhase"
            advanceGameAction={async () => {}}
          />
        }
      >
        <ReportingScreen gamePhase="campPhase" isAvailable={false} />
      </GameScreen>,
    );

    expect(screen.getByRole("button", { name: "To battle" })).toBeDisabled();
  });

  it("(q) battle: enabled once the battle screen reports it's allowed, and its form carries the battle phase", () => {
    renderWithMessages(
      <GameScreen
        phase="battlePhase"
        header={
          <PhaseAdvanceButton
            gamePhase="battlePhase"
            advanceGameAction={async () => {}}
          />
        }
      >
        <ReportingScreen gamePhase="battlePhase" isAvailable={true} />
      </GameScreen>,
    );

    const returnToCampButton = screen.getByRole("button", {
      name: "Return to camp",
    });
    expect(returnToCampButton).toBeEnabled();

    const form = returnToCampButton.closest("form");
    expect(form).not.toBeNull();
    expect(
      new FormData(form as HTMLFormElement).get("expectedCurrentPhase"),
    ).toBe("battlePhase");
  });

  it("(r) battle: a stale report for another phase never enables it", () => {
    renderWithMessages(
      <GameScreen
        phase="battlePhase"
        header={
          <PhaseAdvanceButton
            gamePhase="battlePhase"
            advanceGameAction={async () => {}}
          />
        }
      >
        <ReportingScreen gamePhase="campPhase" isAvailable={true} />
      </GameScreen>,
    );

    expect(
      screen.getByRole("button", { name: "Return to camp" }),
    ).toBeDisabled();
  });
});
