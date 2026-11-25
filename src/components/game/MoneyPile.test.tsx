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
// plays (the pending gold is released) or a sale's gold arrives. Spending
// (a purchase) doesn't trigger it. The animation restarts on every gain by
// switching between two identical keyframes (the parity trick), so tests
// assert the parity attribute, never the animation itself.

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

  it("MPG3: spending gold (a fall) doesn't pulse", () => {
    const { rerender } = renderWithMessages(<MoneyPileUnderTest gold={10} />);

    rerender(<MoneyPileUnderTest gold={7} />);

    expect(gainParity()).toBe("none");
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
});
