// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { AnimatePresence } from "motion/react";
import { render, screen } from "@/test/renderWithMessages";
import type { Character } from "@/lib/game/character";
import messages from "../../../messages/en.json";
import { GameScreenShell } from "./GameScreenShell";

const englishPhaseBattleLabel = messages.common.phaseBattle;

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
        <GameScreenShell
          gamePhase="campPhase"
          playerBenchCharacters={sevenEmptySlots}
        >
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

  // deliberate assertion rewrite: the roster now swipes with the content instead of hiding (Phase 16, the human's call; before: the outgoing roster was hidden so the incoming one stood fixed)
  it("(d) while its screen is exiting, the roster stays visible (it slides out with the content) and both regions are inert", () => {
    const { container, rerender } = render(
      wrapWithMessages(
        <AnimatePresence>
          <GameScreenShell
            key="exiting-screen"
            gamePhase="campPhase"
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
    expect((rosterRegion as HTMLElement | null)?.style.visibility ?? "").not.toBe(
      "hidden",
    );
  });

  it("(g) the roster and the content swipe as one: both regions sit inside the one swiping element", () => {
    const { container } = render(
      wrapWithMessages(
        <GameScreenShell
          gamePhase="campPhase"
          playerBenchCharacters={sevenEmptySlots}
        >
          <p>Shell content</p>
        </GameScreenShell>,
      ),
    );

    const rosterSwipe = container
      .querySelector('[data-game-screen-region="roster"]')
      ?.closest("[data-game-screen-swipe]");
    const contentSwipe = container
      .querySelector('[data-game-screen-region="content"]')
      ?.closest("[data-game-screen-swipe]");

    expect({
      rosterIsInsideASwipe: rosterSwipe != null,
      sameSwipe: rosterSwipe != null && rosterSwipe === contentSwipe,
    }).toEqual({ rosterIsInsideASwipe: true, sameSwipe: true });
  });

  // deliberate assertion rewrite: the phase banner is gone in both phases (Phase 16, the human's call); the phase stays the page heading, for screen readers only (before: (e) and (f) checked the visible banner, PB1 the banner switched off, SE1 and SE2 the iron edge under the slab that sat against it)
  it("(e) camp: no phase banner and no iron slab edge; the phase is still the page heading", () => {
    render(
      wrapWithMessages(
        <GameScreenShell
          gamePhase="campPhase"
          playerBenchCharacters={sevenEmptySlots}
        >
          <p>Shell content</p>
        </GameScreenShell>,
      ),
    );

    expect({
      hasPhaseBanner:
        document.querySelector("[data-game-phase-banner]") !== null,
      hasSlabBaseEdge:
        document.querySelector("[data-slab-base-edge]") !== null,
      // deliberate assertion rewrite: the camp phase banner reads "Shop" (BR4)
      hasShopHeading:
        screen.queryByRole("heading", { level: 1, name: "Shop" }) !== null,
    }).toEqual({
      hasPhaseBanner: false,
      hasSlabBaseEdge: false,
      hasShopHeading: true,
    });
  });

  it("(f) battle: no phase banner; the phase is still the page heading", () => {
    render(
      wrapWithMessages(
        <GameScreenShell
          gamePhase="battlePhase"
          playerBenchCharacters={sevenEmptySlots}
        >
          <p>Shell content</p>
        </GameScreenShell>,
      ),
    );

    expect({
      hasPhaseBanner:
        document.querySelector("[data-game-phase-banner]") !== null,
      hasBattleHeading:
        screen.queryByRole("heading", {
          level: 1,
          name: englishPhaseBattleLabel,
        }) !== null,
    }).toEqual({ hasPhaseBanner: false, hasBattleHeading: true });
  });
});
