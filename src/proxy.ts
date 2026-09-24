/**
 * @file Edge proxy: locale detection and URL normalization.
 *
 * Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`; this
 * file follows the new convention. The exported handler receives every
 * matched request before routing and returns either a redirect or
 * `undefined` (continue to the App Router).
 *
 * `createMiddleware(routing)` from next-intl does three jobs:
 *
 * 1. **Detection** — if the URL has no locale prefix, pick one from the
 *    `NEXT_LOCALE` cookie, then the `Accept-Language` header, then the
 *    default locale, and redirect (307) to the prefixed URL.
 * 2. **Pass-through** — if the URL already carries a valid locale, the
 *    request continues untouched to the App Router.
 * 3. **Cookie sync** — the resolved locale is written back to the
 *    `NEXT_LOCALE` cookie so the choice sticks on return visits.
 *
 * The handler performs pure header/cookie inspection — no Node APIs, no
 * database, no filesystem — which is what keeps locale detection
 * latency-negligible at the CDN edge.
 */
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/**
 * Locale handler, exported as the default so Next.js recognizes this
 * file as the application proxy.
 */
export default createMiddleware(routing);

/**
 * Matcher: every path **except** those that must never be localized.
 *
 * Excluded (and why):
 * - `api` — server endpoints return data, not localized documents.
 * - `_next` — framework build assets (JS/CSS chunks, images).
 * - `_vercel` — Vercel platform endpoints (analytics, speed insights).
 * - any path containing a dot (`.*\\..*`) — static files such as
 *   `/favicon.ico`, `/robots.txt`, `/sitemap.xml`, or images; a locale
 *   prefix on a file extension would 404.
 *
 * Everything else (all page routes) flows through locale detection.
 */
export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
