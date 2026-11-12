// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import { GameStatus } from "./GameStatus";

describe("GameStatus", () => {
  it("(m) shows the day and gold", () => {
    renderWithMessages(<GameStatus day={3} gold={10} />);

    expect(screen.queryByText(/Day 3/)).not.toBeNull();
    expect(screen.queryByText(/10 gold/)).not.toBeNull();
  });
});
