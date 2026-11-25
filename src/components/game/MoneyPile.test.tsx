// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { DragDropProvider } from "@dnd-kit/react";
import { renderWithMessages } from "@/test/renderWithMessages";
import {
  HeaderGoldDisplayProvider,
  useReportPendingHeaderGold,
} from "./headerGoldDisplay";
import { MoneyPile } from "./MoneyPile";

// Phase 16: the money pile swells, glows gold and wobbles a little each
// time its displayed gold goes up: when a camp-start ability's gold floater
// plays (the pending gold is released) or a sale's gold arrives. When the
// saved gold falls (a purchase or a merge-buy), it dips with a cooler glow
// instead. The latest change picks which plays; each animation restarts on
// every change by switching between two identical keyframes (the parity
// trick), so tests assert the attributes, never the animation itself.

function PendingGoldReporter({ pendingGold }: { pendingGold: number }) {
  useReportPendingHeaderGold(pendingGold);
  return null;
}

function MoneyPileUnderTest({
  gold,
  pendingGold = 0,
}: {
  gold: number;
  pendingGold?: number;
}) {
  return (
    <DragDropProvider>
      <HeaderGoldDisplayProvider>
        <PendingGoldReporter pendingGold={pendingGold} />
        <MoneyPile
          gold={gold}
          isSellShown={false}
          sellButtonLabel="Sell?"
          presentation="ineligible"
          isEnabled={false}
          onClick={() => {}}
        />
      </HeaderGoldDisplayProvider>
    </DragDropProvider>
  );
}

function spendParity(): string | null {
  return (
    document
      .querySelector("[data-money-pile]")
      ?.getAttribute("data-money-pile-spend-parity") ?? null
  );
}

function lastGoldChange(): string | null {
  return (
    document
      .querySelector("[data-money-pile]")
      ?.getAttribute("data-money-pile-last-gold-change") ?? null
  );
}

function gainParity(): string | null {
  return (
    document
      .querySelector("[data-money-pile]")
      ?.getAttribute("data-money-pile-gain-parity") ?? null
  );
}

describe("money pile gain pulse (Phase 16)", () => {
  it("MPG1: no pulse on arrival", () => {
    renderWithMessages(<MoneyPileUnderTest gold={10} />);

    expect(gainParity()).toBe("none");
  });

  it("MPG2: each rise in the gold pulses again, switching parity so the animation restarts", () => {
    const { rerender } = renderWithMessages(<MoneyPileUnderTest gold={10} />);
    const paritiesAfterEachRise: (string | null)[] = [];

    rerender(<MoneyPileUnderTest gold={11} />);
    paritiesAfterEachRise.push(gainParity());
    rerender(<MoneyPileUnderTest gold={12} />);
    paritiesAfterEachRise.push(gainParity());
    rerender(<MoneyPileUnderTest gold={13} />);
    paritiesAfterEachRise.push(gainParity());

    expect(paritiesAfterEachRise).toEqual(["odd", "even", "odd"]);
  });

  // deliberate assertion rewrite: spending now plays its own dip, so a fall is not a gain but is a spend (Phase 16, the human's call; before: a fall pulsed nothing)
  it("MPG3: spending gold (a fall) isn't a gain: it plays the spend dip instead", () => {
    const { rerender } = renderWithMessages(<MoneyPileUnderTest gold={10} />);

    rerender(<MoneyPileUnderTest gold={7} />);

    expect({
      gainParity: gainParity(),
      spendParity: spendParity(),
      lastChange: lastGoldChange(),
    }).toEqual({ gainParity: "none", spendParity: "odd", lastChange: "spend" });
  });

  it("MPG4: during the start-of-camp sequence, releasing pending gold pulses as the shown gold rises; arriving with gold held back doesn't", () => {
    const { rerender } = renderWithMessages(
      <MoneyPileUnderTest gold={10} pendingGold={3} />,
    );
    const paritiesAsGoldIsReleased: (string | null)[] = [gainParity()];

    rerender(<MoneyPileUnderTest gold={10} pendingGold={2} />);
    paritiesAsGoldIsReleased.push(gainParity());
    rerender(<MoneyPileUnderTest gold={10} pendingGold={0} />);
    paritiesAsGoldIsReleased.push(gainParity());

    expect(paritiesAsGoldIsReleased).toEqual(["none", "odd", "even"]);
    expect(
      document.querySelector("[data-money-pile-gold]")?.textContent,
    ).toBe("10 gold");
  });

  it("MPS1: nothing has changed on arrival; each spend dips again, switching parity so the animation restarts", () => {
    const { rerender } = renderWithMessages(<MoneyPileUnderTest gold={10} />);
    const statesAfterEachChange: (string | null)[][] = [
      [lastGoldChange(), spendParity()],
    ];

    rerender(<MoneyPileUnderTest gold={7} />);
    statesAfterEachChange.push([lastGoldChange(), spendParity()]);
    rerender(<MoneyPileUnderTest gold={4} />);
    statesAfterEachChange.push([lastGoldChange(), spendParity()]);

    expect(statesAfterEachChange).toEqual([
      ["none", "none"],
      ["spend", "odd"],
      ["spend", "even"],
    ]);
  });

  it("MPS2: the latest change picks the animation: a gain after a spend plays the gain, a spend after a gain plays the dip", () => {
    const { rerender } = renderWithMessages(<MoneyPileUnderTest gold={10} />);
    const lastChanges: (string | null)[] = [];

    rerender(<MoneyPileUnderTest gold={7} />);
    lastChanges.push(lastGoldChange());
    rerender(<MoneyPileUnderTest gold={8} />);
    lastChanges.push(lastGoldChange());
    rerender(<MoneyPileUnderTest gold={5} />);
    lastChanges.push(lastGoldChange());

    expect({
      lastChanges,
      gainParity: gainParity(),
      spendParity: spendParity(),
    }).toEqual({
      lastChanges: ["spend", "gain", "spend"],
      gainParity: "odd",
      spendParity: "even",
    });
  });

  it("MPS3: arriving with gold held back by the start-of-camp sequence isn't a spend (the saved gold didn't fall)", () => {
    renderWithMessages(<MoneyPileUnderTest gold={10} pendingGold={3} />);

    expect({
      lastChange: lastGoldChange(),
      spendParity: spendParity(),
      shownGold: document.querySelector("[data-money-pile-gold]")?.textContent,
    }).toEqual({ lastChange: "none", spendParity: "none", shownGold: "7 gold" });
  });
});
