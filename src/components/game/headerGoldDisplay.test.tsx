// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages } from "@/test/renderWithMessages";
import {
  DisplayedGold,
  HeaderGoldDisplayProvider,
  useReportPendingHeaderGold,
} from "./headerGoldDisplay";

function Reporter({ pendingGold }: { pendingGold: number }) {
  useReportPendingHeaderGold(pendingGold);
  return null;
}

describe("HeaderGoldDisplayProvider / DisplayedGold", () => {
  it("HG1: the header shows gold minus the pending gold reported inside the provider; with no report it shows the full gold", () => {
    const { unmount } = renderWithMessages(
      <HeaderGoldDisplayProvider>
        <Reporter pendingGold={3} />
        <DisplayedGold gold={13} />
      </HeaderGoldDisplayProvider>,
    );

    const withProviderText = document.querySelector("[data-displayed-gold]")
      ?.textContent;
    unmount();

    renderWithMessages(<DisplayedGold gold={13} />);

    const withoutProviderText = document.querySelector("[data-displayed-gold]")
      ?.textContent;

    expect([withProviderText, withoutProviderText]).toEqual([
      "10 gold",
      "13 gold",
    ]);
  });
});
