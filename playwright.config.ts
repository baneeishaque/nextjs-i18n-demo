/**
 * Playwright configuration.
 *
 * The suite runs against a **production build** (`next build` runs via
 * the `pretest:e2e` npm hook), not `next dev`: static generation,
 * middleware behavior, and redirect caching are all part of what these
 * tests verify, and none of them behave identically in dev mode.
 *
 * `reuseExistingServer` keeps local iteration fast (a running server is
 * reused); CI always starts a fresh one.
 */
import { defineConfig, devices } from "@playwright/test";

/** Port dedicated to E2E so a dev server on 3000 never collides. */
const PORT = 3100;

/** Base URL every test resolves relative paths against. */
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: `${BASE_URL}/en`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
