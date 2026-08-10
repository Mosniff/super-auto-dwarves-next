// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import { LocaleSwitcher } from "./LocaleSwitcher";

describe("LocaleSwitcher", () => {
  it("renders the trigger showing the current locale's name", () => {
    renderWithMessages(<LocaleSwitcher />);

    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("carries the accessible language label", () => {
    renderWithMessages(<LocaleSwitcher />);

    expect(screen.getByLabelText("Language")).toBeInTheDocument();
  });
});
