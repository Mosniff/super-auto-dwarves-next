// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import { GameStatus } from "./GameStatus";

describe("GameStatus", () => {
  // deliberate assertion rewrite: the header shows only the day, centred (Phase 16, the human's call; before: the day and the gold)
  it("(m) shows the day", () => {
    // deliberate test-data update: GameStatus takes the phase for its sun / moon (Phase 16 header flare)
    renderWithMessages(<GameStatus day={3} gamePhase="campPhase" />);

    expect(
      document.querySelector("[data-game-status]")?.textContent ?? null,
    ).toBe("Day 3");
  });

  // deliberate assertion rewrite: the gold (now on camp's money pile), the depth and the placeholder gem count left the header (Phase 16, the human's call; before: (m2) showed the gems and (m3) the depth)
  it("(m2) shows no gold, depth or gems", () => {
    // deliberate test-data update: GameStatus takes the phase for its sun / moon (Phase 16 header flare)
    renderWithMessages(<GameStatus day={3} gamePhase="campPhase" />);

    expect({
      gold: screen.queryByText(/gold/),
      depth: screen.queryByText(/Depth/),
      gems: screen.queryByText(/gems/),
    }).toEqual({ gold: null, depth: null, gems: null });
  });

  it("(m3) a sun beside the day at camp, a moon in battle", () => {
    const { rerender } = renderWithMessages(
      <GameStatus day={3} gamePhase="campPhase" />,
    );
    const phaseIcons: (string | null)[] = [
      document
        .querySelector("[data-game-status]")
        ?.getAttribute("data-game-status-phase-icon") ?? null,
    ];

    rerender(<GameStatus day={3} gamePhase="battlePhase" />);
    phaseIcons.push(
      document
        .querySelector("[data-game-status]")
        ?.getAttribute("data-game-status-phase-icon") ?? null,
    );

    expect(phaseIcons).toEqual(["sun", "moon"]);
  });
});
