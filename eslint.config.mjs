import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * ESLint flat configuration.
 *
 * Composition order matters: Next.js core-web-vitals rules (accessibility,
 * performance, image/font lint) are layered first, then the TypeScript-aware
 * preset. `globalIgnores` replaces the legacy `.eslintignore` file and keeps
 * generated output (` .next`, coverage, Playwright reports) out of linting.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
