// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { AnimatePresence } from "motion/react";
import { render } from "@/test/renderWithMessages";
import type { Character } from "@/lib/game/character";
import messages from "../../../messages/en.json";
import { GameScreenShell } from "./GameScreenShell";

const sevenEmptySlots: (Character | null)[] = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];

function wrapWithMessages(children: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

describe("GameScreenShell", () => {
  it("(c) outside a swipe, neither region is inert", () => {
    const { container } = render(
      wrapWithMessages(
        <GameScreenShell playerBenchCharacters={sevenEmptySlots}>
          <p>Shell content</p>
        </GameScreenShell>,
      ),
    );

    const rosterRegion = container.querySelector(
      '[data-game-screen-region="roster"]',
    );
    const contentRegion = container.querySelector(
      '[data-game-screen-region="content"]',
    );

    expect(rosterRegion).not.toBeNull();
    expect(contentRegion).not.toBeNull();
    expect(rosterRegion).not.toHaveAttribute("inert");
    expect(contentRegion).not.toHaveAttribute("inert");
  });

  it("(d) while its screen is exiting, the roster is hidden and both regions are inert", () => {
    const { container, rerender } = render(
      wrapWithMessages(
        <AnimatePresence>
          <GameScreenShell
            key="exiting-screen"
            playerBenchCharacters={sevenEmptySlots}
          >
            <p>Shell content</p>
          </GameScreenShell>
        </AnimatePresence>,
      ),
    );

    rerender(wrapWithMessages(<AnimatePresence>{null}</AnimatePresence>));

    const rosterRegion = container.querySelector(
      '[data-game-screen-region="roster"]',
    );
    const contentRegion = container.querySelector(
      '[data-game-screen-region="content"]',
    );

    expect(rosterRegion).not.toBeNull();
    expect(contentRegion).not.toBeNull();
    expect(rosterRegion).toHaveAttribute("inert");
    expect(contentRegion).toHaveAttribute("inert");

    const presenceAncestor = rosterRegion?.closest(
      "[data-game-screen-presence]",
    );

    expect(presenceAncestor?.getAttribute("data-game-screen-presence") ?? null).toBe(
      "exiting",
    );
  });
});
