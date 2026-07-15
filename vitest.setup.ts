import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// @testing-library/react's built-in auto-cleanup only self-registers when
// `afterEach` is a real global, which requires `test.globals: true` in
// vitest.config.ts. This project doesn't set that, so cleanup is wired up
// explicitly here instead. Safe for node-environment tests too — cleanup()
// only iterates containers that render() actually mounted.
afterEach(() => {
  cleanup();
});
