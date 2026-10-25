// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import { SaveSlab } from "./SaveSlab";

describe("SaveSlab", () => {
  it("(a) with no saved game, shows the empty-state text and a New game button", () => {
    renderWithMessages(
      <SaveSlab
        savedGameSummary={null}
        createGameAction={async () => {}}
        deleteGameAction={async () => {}}
      />,
    );

    expect(screen.getByText("No saved game")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New game" }),
    ).toBeInTheDocument();
  });

  it("(b) with a saved game, shows the day, phase, started text and a Resume link to /play", () => {
    renderWithMessages(
      <SaveSlab
        savedGameSummary={{
          createdAt: new Date("2026-10-13T12:00:00.000Z"),
          day: 3,
          phase: "campPhase",
        }}
        createGameAction={async () => {}}
        deleteGameAction={async () => {}}
      />,
    );

    expect(screen.getByText(/Day 3/)).toBeInTheDocument();
    expect(screen.getByText(/Camp/)).toBeInTheDocument();
    expect(screen.getByText(/Started/)).toBeInTheDocument();

    const resumeLink = screen.getByRole("link", { name: "Resume" });
    expect(resumeLink).toBeInTheDocument();
    expect(resumeLink).toHaveAttribute("href", "/play");
  });

  it("(c) with a saved game, shows a Delete button and no New game button", () => {
    renderWithMessages(
      <SaveSlab
        savedGameSummary={{
          createdAt: new Date("2026-10-13T12:00:00.000Z"),
          day: 3,
          phase: "campPhase",
        }}
        createGameAction={async () => {}}
        deleteGameAction={async () => {}}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Delete" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "New game" }),
    ).not.toBeInTheDocument();
  });
});
