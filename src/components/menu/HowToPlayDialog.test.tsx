// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import {
  render,
  renderWithMessages,
  screen,
  within,
} from "@/test/renderWithMessages";
import englishMessages from "../../../messages/en.json";
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

  // deliberate assertion rewrite: the placeholder became the guide (before: the dialog says "Coming soon"; after: its headings, in order, and the intro as its description) — Phase 15, the human's call
  it("H2: pressing the button opens the How to Play guide: its intro describes the dialog and its headings run Camp then Battle", async () => {
    const user = userEvent.setup();
    renderWithMessages(<HowToPlayDialog />);

    await user.click(screen.getByRole("button", { name: "How to Play" }));

    const dialog = screen.getByRole("dialog", { name: "How to Play" });
    expect({
      headings: within(dialog)
        .getAllByRole("heading")
        .map((heading) => `${heading.tagName}: ${heading.textContent}`),
      startsDescription:
        dialog
          .getAttribute("aria-describedby")
          ?.split(" ")
          .map(
            (describingElementId) =>
              document.getElementById(describingElementId)?.textContent ?? "",
          )
          .join(" ")
          .startsWith("Super Auto Dwarves is a game about recruiting") ?? false,
    }).toEqual({
      headings: [
        "H2: How to Play",
        "H3: Camp",
        "H4: Recruiting",
        "H4: Promoting",
        "H4: Merging and selling",
        "H4: Your line-up",
        "H3: Battle",
        "H4: How a fight works",
        "H4: Watching",
      ],
      startsDescription: true,
    });
  });

  it("H5: merging and selling are a two-item list, each led by its bold name", async () => {
    const user = userEvent.setup();
    renderWithMessages(<HowToPlayDialog />);

    await user.click(screen.getByRole("button", { name: "How to Play" }));

    const dialog = screen.getByRole("dialog", { name: "How to Play" });
    expect(
      within(dialog)
        .getAllByRole("listitem")
        .map((listItem) => listItem.querySelector("strong")?.textContent ?? null),
    ).toEqual(["Merge:", "Sell:"]);
  });

  it("H6: every message in the howToPlay namespace appears in the dialog, without its tags", async () => {
    const user = userEvent.setup();
    renderWithMessages(<HowToPlayDialog />);

    await user.click(screen.getByRole("button", { name: "How to Play" }));

    const dialogText =
      screen.getByRole("dialog", { name: "How to Play" }).textContent ?? "";
    expect(
      Object.entries(englishMessages.howToPlay)
        .filter(
          ([, messageText]) =>
            !dialogText.includes(messageText.replace(/<\/?strong>/g, "")),
        )
        .map(([messageKey]) => messageKey),
    ).toEqual([]);
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

  it("H7: the game header's trigger opens the same guide", async () => {
    const user = userEvent.setup();
    renderWithMessages(<HowToPlayDialog triggerPlacement="header" />);

    const headerTrigger = screen.getByRole("button", { name: "How to Play" });
    await user.click(headerTrigger);

    expect({
      triggerPlacement: headerTrigger.getAttribute(
        "data-how-to-play-trigger",
      ),
      dialogIsOpen:
        screen.queryByRole("dialog", { name: "How to Play" }) !== null,
    }).toEqual({ triggerPlacement: "header", dialogIsOpen: true });
  });

  // deliberate assertion rewrite: the placeholder became the guide (before: the dialog says 近日公開; after: its Japanese headings, in order) — Phase 15, the human's call
  it("H4: in Japanese, the button and title read あそびかた and the guide's headings are Japanese", async () => {
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="ja" messages={japaneseMessages}>
        <HowToPlayDialog />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "あそびかた" }));

    const dialog = screen.getByRole("dialog", { name: "あそびかた" });
    expect(
      within(dialog)
        .getAllByRole("heading")
        .map((heading) => heading.textContent),
    ).toEqual([
      "あそびかた",
      "キャンプ",
      "ドワーフを雇う",
      "昇格",
      "合成と売却",
      "並び順",
      "バトル",
      "戦いのしくみ",
      "観戦する",
    ]);
  });
});
