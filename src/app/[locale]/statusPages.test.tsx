// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { render, renderWithMessages, screen } from "@/test/renderWithMessages";
import japaneseMessages from "../../../messages/ja.json";
import LocaleErrorPage from "./error";
import LocaleNotFoundPage from "./not-found";
import UnknownPathPage from "./[...rest]/page";

// The error page logs the error (Next's documented pattern); silenced here.
afterEach(() => {
  vi.restoreAllMocks();
});

describe("error page", () => {
  it("S1: shows the translated title and a Try again button that calls retry", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithMessages(<LocaleErrorPage error={new Error("fixture failure")} retry={retry} />);

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect([
      screen.getByRole("heading", { level: 1 }).textContent,
      retry.mock.calls.length,
    ]).toEqual(["Something went wrong", 1]);
  });

  it("S2: links back to the menu", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithMessages(<LocaleErrorPage error={new Error("fixture failure")} retry={() => {}} />);

    // jsdom renders next-intl links without the locale prefix (as SaveSlab.test.tsx relies on)
    expect(
      screen.getByRole("link", { name: "Back to menu" }).getAttribute("href"),
    ).toBe("/");
  });
});

describe("not-found page", () => {
  it("S3: shows the translated title and links back to the menu", () => {
    renderWithMessages(<LocaleNotFoundPage />);

    expect([
      screen.getByRole("heading", { level: 1 }).textContent,
      screen.getByRole("link", { name: "Back to menu" }).getAttribute("href"),
    ]).toEqual(["Page not found", "/"]);
  });

  it("S4: in Japanese, shows the Japanese title and back link", () => {
    render(
      <NextIntlClientProvider locale="ja" messages={japaneseMessages}>
        <LocaleNotFoundPage />
      </NextIntlClientProvider>,
    );

    expect([
      screen.getByRole("heading", { level: 1 }).textContent,
      screen.getByRole("link", { name: "メニューへもどる" }).getAttribute("href"),
    ]).toEqual(["ページが見つかりません", "/"]);
  });
});

describe("unknown paths", () => {
  it("S5: an unknown path inside a locale throws Next's not-found signal", () => {
    let thrown: unknown = null;
    try {
      UnknownPathPage();
    } catch (error) {
      thrown = error;
    }
    expect(
      (thrown as { digest?: unknown } | null)?.digest ?? null,
    ).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
