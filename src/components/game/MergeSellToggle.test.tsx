// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import { MergeSellToggle } from "./MergeSellToggle";

function renderMergeSellToggle(isMergeOrSellModeActive: boolean) {
  return renderWithMessages(
    <MergeSellToggle
      isMergeOrSellModeActive={isMergeOrSellModeActive}
      isLatched={false}
      onClick={() => {}}
      isDisabled={false}
    />,
  );
}

function modeLabels(container: HTMLElement) {
  return [...container.querySelectorAll("[data-merge-sell-mode-label]")].map(
    (modeLabelElement) => ({
      mode: modeLabelElement.getAttribute("data-merge-sell-mode-label"),
      text: modeLabelElement.textContent,
      isShown: modeLabelElement.getAttribute("data-merge-sell-mode-label-shown"),
    }),
  );
}

describe("MergeSellToggle", () => {
  it("MT1: in reposition mode, only the Reposition label is shown above the toggle", () => {
    expect(modeLabels(renderMergeSellToggle(false).container)).toEqual([
      { mode: "reposition", text: "Reposition", isShown: "true" },
      { mode: "mergeOrSell", text: "Merge / Sell", isShown: "false" },
    ]);
  });

  it("MT2: in merge/sell mode, only the Merge / Sell label is shown above the toggle", () => {
    expect(modeLabels(renderMergeSellToggle(true).container)).toEqual([
      { mode: "reposition", text: "Reposition", isShown: "false" },
      { mode: "mergeOrSell", text: "Merge / Sell", isShown: "true" },
    ]);
  });

  it("MT3: the (hold SHIFT) hint shows in both modes", () => {
    const shiftHintTexts = [false, true].map((isMergeOrSellModeActive) => {
      const { container, unmount } = renderMergeSellToggle(
        isMergeOrSellModeActive,
      );
      const shiftHintText =
        container.querySelector("[data-merge-sell-shift-hint]")?.textContent ??
        null;
      unmount();
      return shiftHintText;
    });

    expect(shiftHintTexts).toEqual(["(hold SHIFT)", "(hold SHIFT)"]);
  });

  it("MT4: the button's accessible name stays Merge / Sell in both modes", () => {
    const accessibleNames = [false, true].map((isMergeOrSellModeActive) => {
      const { unmount } = renderMergeSellToggle(isMergeOrSellModeActive);
      const accessibleName = screen
        .getByRole("button")
        .getAttribute("aria-label");
      unmount();
      return accessibleName;
    });

    expect(accessibleNames).toEqual(["Merge / Sell", "Merge / Sell"]);
  });
});
