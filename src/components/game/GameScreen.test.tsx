// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GameScreen } from "./GameScreen";

describe("GameScreen", () => {
  it("(a) renders the screen it is given", () => {
    render(
      <GameScreen phase="campPhase">
        <p>Camp content</p>
      </GameScreen>,
    );

    expect(screen.getByText("Camp content")).toBeInTheDocument();
  });

  it("(b) shows the new screen after the phase changes", () => {
    const { rerender } = render(
      <GameScreen phase="campPhase">
        <p>Camp content</p>
      </GameScreen>,
    );

    rerender(
      <GameScreen phase="battlePhase">
        <p>Battle content</p>
      </GameScreen>,
    );

    expect(screen.getByText("Battle content")).toBeInTheDocument();
  });

  it("(n) renders the header outside the swiping screen", () => {
    render(
      <GameScreen phase="campPhase" header={<p>Header content</p>}>
        <p>Camp content</p>
      </GameScreen>,
    );

    const headerElement = screen.queryByText("Header content");
    expect(headerElement).not.toBeNull();
    expect(headerElement?.closest("[data-game-screen-phase]")).toBeNull();
  });
});
