// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import { GameOverScreen } from "./GameOverScreen";

describe("GameOverScreen", () => {
  it("GOS1: shows the title, the day and depth the party fell at, and Return to menu as the end-run form's submit", () => {
    renderWithMessages(
      <GameOverScreen day={4} depth={4} endRunAction={async () => {}} />,
    );

    const returnToMenuButton = screen.queryByRole("button", {
      name: "Return to menu",
    });

    expect({
      title: screen.queryByRole("heading", { name: "Game over" }) !== null,
      summary:
        screen.queryByText("Your party fell on day 4, at depth 4.") !== null,
      buttonType: returnToMenuButton?.getAttribute("type"),
      isInsideEndRunForm:
        returnToMenuButton?.closest("form[data-end-run]") != null,
    }).toEqual({
      title: true,
      summary: true,
      buttonType: "submit",
      isInsideEndRunForm: true,
    });
  });
});
