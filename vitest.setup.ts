/**
 * Vitest global setup.
 *
 * 1. Registers jest-dom matchers (`toBeInTheDocument`, `toHaveValue`, ...)
 *    on Vitest's `expect`.
 * 2. Unmounts every rendered tree after each test. React Testing Library
 *    only auto-cleans when test globals are enabled; this project keeps
 *    explicit imports, so cleanup is wired manually — without it, DOM
 *    from one test leaks into the next.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
