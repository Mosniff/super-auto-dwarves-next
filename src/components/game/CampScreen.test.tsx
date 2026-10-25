// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import { CampScreen } from "./CampScreen";

describe("CampScreen", () => {
  it("(a) shows the camp heading, day, gold and a To battle button", () => {
    renderWithMessages(
      <CampScreen
        playerRosterCharacters={[]}
        day={3}
        gold={10}
        advanceGameAction={async () => {}}
      />,
    );

    expect(screen.getByText("Camp")).toBeInTheDocument();
    expect(screen.getByText(/Day 3/)).toBeInTheDocument();
    expect(screen.getByText(/10 gold/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "To battle" }),
    ).toBeInTheDocument();
  });

  it("(b) the To battle button's form submits expectedCurrentPhase as campPhase", () => {
    renderWithMessages(
      <CampScreen
        playerRosterCharacters={[]}
        day={3}
        gold={10}
        advanceGameAction={async () => {}}
      />,
    );

    const toBattleButton = screen.getByRole("button", { name: "To battle" });
    const form = toBattleButton.closest("form");

    // This field is the load-bearing intent qualifier for the server's
    // stale-advance guard (advanceGameForUser).
    expect(form).not.toBeNull();
    expect(
      new FormData(form as HTMLFormElement).get("expectedCurrentPhase"),
    ).toBe("campPhase");
  });
});
