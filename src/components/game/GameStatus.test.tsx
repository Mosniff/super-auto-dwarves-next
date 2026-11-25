// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import { GameStatus } from "./GameStatus";

describe("GameStatus", () => {
  // deliberate assertion rewrite: the header shows only the day, centred (Phase 16, the human's call; before: the day and the gold)
  it("(m) shows the day", () => {
    renderWithMessages(<GameStatus day={3} />);

    expect(
      document.querySelector("[data-game-status]")?.textContent ?? null,
    ).toBe("Day 3");
  });

  // deliberate assertion rewrite: the gold (now on camp's money pile), the depth and the placeholder gem count left the header (Phase 16, the human's call; before: (m2) showed the gems and (m3) the depth)
  it("(m2) shows no gold, depth or gems", () => {
    renderWithMessages(<GameStatus day={3} />);

    expect({
      gold: screen.queryByText(/gold/),
      depth: screen.queryByText(/Depth/),
      gems: screen.queryByText(/gems/),
    }).toEqual({ gold: null, depth: null, gems: null });
  });
});
