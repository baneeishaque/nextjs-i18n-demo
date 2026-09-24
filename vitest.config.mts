/**
 * Vitest configuration.
 *
 * - `jsdom` environment: component tests render real DOM nodes.
 * - `@vitejs/plugin-react`: JSX transform + React Fast Refresh in watch mode.
 * - `@` alias mirrors the tsconfig path mapping so tests import modules
 *   exactly the way application code does.
 * - Coverage is collected from `src/` only; tests and type-only files are
 *   excluded so the percentage reflects shippable code.
 */
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts"],
    },
  },
});
