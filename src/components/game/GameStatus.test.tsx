// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import { GameStatus } from "./GameStatus";

describe("GameStatus", () => {
  it("(m) shows the day and gold", () => {
    renderWithMessages(<GameStatus day={3} depth={3} gold={10} gems={0} />);

    expect(screen.queryByText(/Day 3/)).not.toBeNull();
    expect(screen.queryByText(/10 gold/)).not.toBeNull();
  });

  it("(m2) shows the gem count", () => {
    renderWithMessages(<GameStatus day={3} depth={3} gold={10} gems={0} />);

    expect(screen.queryByText(/0 gems/)).not.toBeNull();
  });

  it("(m3) shows the depth", () => {
    renderWithMessages(<GameStatus day={3} depth={5} gold={10} gems={0} />);

    expect(screen.queryByText("Depth 5")).not.toBeNull();
  });
});
