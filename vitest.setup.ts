import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom/vitest";

// Navigation is a framework boundary — Next.js / next-intl own it, not our
// code — so it's mocked globally here rather than requiring every
// interactive-component test to mount a real Next App Router context (which
// jsdom has no way to provide; next-intl's useRouter calls Next's real
// useRouter internally and throws "invariant expected app router to be
// mounted" without one). Individual tests can import useRouter from
// "@/i18n/navigation" to assert on the mocked calls if they need to.
// Link is rendered via React.createElement (not JSX) because this setup
// file is .ts, not .tsx.
vi.mock("@/i18n/navigation", () => {
  const MockLink = ({
    children,
    href,
    ...rest
  }: {
    children?: React.ReactNode;
    href?: string;
  } & Omit<React.ComponentPropsWithoutRef<"a">, "href">) =>
    React.createElement("a", { href: href ?? "#", ...rest }, children);

  return {
    useRouter: () => ({
      replace: vi.fn(),
      push: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }),
    usePathname: () => "/",
    redirect: vi.fn(),
    Link: MockLink,
  };
});

// @testing-library/react's built-in auto-cleanup only self-registers when
// `afterEach` is a real global, which requires `test.globals: true` in
// vitest.config.ts. This project doesn't set that, so cleanup is wired up
// explicitly here instead. Safe for node-environment tests too — cleanup()
// only iterates containers that render() actually mounted.
afterEach(() => {
  cleanup();
});
