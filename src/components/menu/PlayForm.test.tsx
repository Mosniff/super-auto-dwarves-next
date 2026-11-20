// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import { PlayForm } from "./PlayForm";

// The real widget loads Cloudflare's script, which jsdom can't run. This
// fake records the props it was last rendered with, and exposes buttons
// that fire its callbacks; on success it renders the hidden
// cf-turnstile-response input the real widget injects into its form.
let lastRenderedTurnstileProps: {
  siteKey: string;
  language: string | undefined;
} | null = null;

vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: (props: {
    siteKey: string;
    options?: { language?: string };
    onSuccess?: (token: string) => void;
    onExpire?: () => void;
    onError?: () => void;
  }) => {
    lastRenderedTurnstileProps = {
      siteKey: props.siteKey,
      language: props.options?.language,
    };
    const [fakeToken, setFakeToken] = useState<string | null>(null);
    return (
      <div data-fake-turnstile>
        {fakeToken !== null && (
          <input type="hidden" name="cf-turnstile-response" value={fakeToken} />
        )}
        <button
          type="button"
          onClick={() => {
            setFakeToken("fixture-captcha-token");
            props.onSuccess?.("fixture-captcha-token");
          }}
        >
          Fake Turnstile success
        </button>
        <button
          type="button"
          onClick={() => {
            setFakeToken(null);
            props.onExpire?.();
          }}
        >
          Fake Turnstile expire
        </button>
        <button
          type="button"
          onClick={() => {
            setFakeToken(null);
            props.onError?.();
          }}
        >
          Fake Turnstile error
        </button>
      </div>
    );
  },
}));

const noopPlayAction = async () => {};
const expectedWidgetProps = { siteKey: "fixture-site-key", language: "en" };

beforeEach(() => {
  lastRenderedTurnstileProps = null;
});

describe("PlayForm", () => {
  it("(a) a returning player sees no widget and an enabled Play button", () => {
    renderWithMessages(
      <PlayForm
        requiresHumanCheck={false}
        turnstileSiteKey="fixture-site-key"
        playAction={noopPlayAction}
      />,
    );
    expect([
      lastRenderedTurnstileProps,
      screen.getByRole("button", { name: "Play" }).hasAttribute("disabled"),
    ]).toEqual([null, false]);
  });

  it("(b) a new visitor sees the widget with the site key and locale, and Play starts disabled", () => {
    renderWithMessages(
      <PlayForm
        requiresHumanCheck
        turnstileSiteKey="fixture-site-key"
        playAction={noopPlayAction}
      />,
    );
    expect(lastRenderedTurnstileProps).toEqual(expectedWidgetProps);
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
  });

  it("(c) Play enables once the widget succeeds", async () => {
    const user = userEvent.setup();
    renderWithMessages(
      <PlayForm
        requiresHumanCheck
        turnstileSiteKey="fixture-site-key"
        playAction={noopPlayAction}
      />,
    );
    expect(lastRenderedTurnstileProps).toEqual(expectedWidgetProps);
    await user.click(
      screen.getByRole("button", { name: "Fake Turnstile success" }),
    );
    expect(screen.getByRole("button", { name: "Play" })).toBeEnabled();
  });

  it("(d) Play disables again when the token expires", async () => {
    const user = userEvent.setup();
    renderWithMessages(
      <PlayForm
        requiresHumanCheck
        turnstileSiteKey="fixture-site-key"
        playAction={noopPlayAction}
      />,
    );
    expect(lastRenderedTurnstileProps).toEqual(expectedWidgetProps);
    await user.click(
      screen.getByRole("button", { name: "Fake Turnstile success" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Fake Turnstile expire" }),
    );
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
  });

  it("(e) Play disables again when the widget errors", async () => {
    const user = userEvent.setup();
    renderWithMessages(
      <PlayForm
        requiresHumanCheck
        turnstileSiteKey="fixture-site-key"
        playAction={noopPlayAction}
      />,
    );
    expect(lastRenderedTurnstileProps).toEqual(expectedWidgetProps);
    await user.click(
      screen.getByRole("button", { name: "Fake Turnstile success" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Fake Turnstile error" }),
    );
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
  });

  it("(f) with no site key configured, shows no widget and leaves Play enabled", () => {
    renderWithMessages(
      <PlayForm
        requiresHumanCheck
        turnstileSiteKey={undefined}
        playAction={noopPlayAction}
      />,
    );
    expect([
      lastRenderedTurnstileProps,
      screen.getByRole("button", { name: "Play" }).hasAttribute("disabled"),
    ]).toEqual([null, false]);
  });

  it("(g) pressing Play after success submits the widget's token with the form", async () => {
    const recordedPlayFormValues: Record<string, FormDataEntryValue>[] = [];
    const recordingPlayAction = async (formData: FormData) => {
      recordedPlayFormValues.push(Object.fromEntries(formData));
    };
    const user = userEvent.setup();
    renderWithMessages(
      <PlayForm
        requiresHumanCheck
        turnstileSiteKey="fixture-site-key"
        playAction={recordingPlayAction}
      />,
    );
    expect(lastRenderedTurnstileProps).toEqual(expectedWidgetProps);
    await user.click(
      screen.getByRole("button", { name: "Fake Turnstile success" }),
    );
    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(recordedPlayFormValues).toEqual([
      { "cf-turnstile-response": "fixture-captcha-token" },
    ]);
  });
});
