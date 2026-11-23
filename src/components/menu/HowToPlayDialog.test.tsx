// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { render, renderWithMessages, screen } from "@/test/renderWithMessages";
import japaneseMessages from "../../../messages/ja.json";
import { HowToPlayDialog } from "./HowToPlayDialog";

describe("HowToPlayDialog", () => {
  it("H1: shows a How to Play button and no dialog until it is pressed", () => {
    renderWithMessages(<HowToPlayDialog />);

    expect([
      screen.getAllByRole("button", { name: "How to Play" }).length,
      screen.queryByRole("dialog"),
    ]).toEqual([1, null]);
  });

  it("H2: pressing the button opens a dialog titled How to Play that says it's coming soon", async () => {
    const user = userEvent.setup();
    renderWithMessages(<HowToPlayDialog />);

    await user.click(screen.getByRole("button", { name: "How to Play" }));

    const dialog = screen.getByRole("dialog", { name: "How to Play" });
    expect([
      dialog.querySelector("h2")?.textContent ?? null,
      dialog.textContent?.includes("Coming soon") ?? false,
    ]).toEqual(["How to Play", true]);
  });

  it("H3: the dialog's Close button closes it and returns focus to the How to Play button", async () => {
    const user = userEvent.setup();
    renderWithMessages(<HowToPlayDialog />);
    const howToPlayButton = screen.getByRole("button", { name: "How to Play" });

    await user.click(howToPlayButton);
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect([
      screen.queryByRole("dialog"),
      document.activeElement === howToPlayButton,
    ]).toEqual([null, true]);
  });

  it("H4: in Japanese, the button and title read あそびかた and the dialog says 近日公開", async () => {
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="ja" messages={japaneseMessages}>
        <HowToPlayDialog />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "あそびかた" }));

    const dialog = screen.getByRole("dialog", { name: "あそびかた" });
    expect(dialog.textContent?.includes("近日公開") ?? false).toBe(true);
  });
});
