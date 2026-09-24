import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * Wraps the Next.js configuration with the next-intl plugin.
 *
 * The plugin performs two jobs at build time:
 * 1. It registers the request configuration module (`src/i18n/request.ts`) so
 *    that server components can resolve messages per request locale.
 * 2. It enables the `next-intl` build-time optimizations (message tree
 *    shaking) that keep only the used ICU message keys in the client bundle.
 *
 * The request config path is passed explicitly (instead of relying on the
 * default `./i18n/request.ts` convention) so the i18n module can live under
 * `src/` and stay colocated with the rest of the application source.
 */
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Baseline Next.js configuration for the multilingual demo.
 *
 * Notes on deliberate choices:
 * - `typedRoutes` is disabled because next-intl's `Link` wrapper already
 *   provides type-safe locale-aware navigation; enabling both produces
 *   conflicting route types for dynamic `[locale]` segments.
 * - `reactStrictMode` stays enabled to surface unsafe lifecycles early; all
 *   components in this repo are pure and re-render-safe.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
