/**
 * @file next-intl routing definition.
 *
 * `defineRouting` produces the routing contract that is shared by the
 * middleware (URL parsing + locale detection), the navigation APIs
 * (`Link`, `useRouter`, `redirect`, ...), and the request configuration.
 * Keeping it in one module guarantees the server, the Edge runtime, and
 * the client all agree on which URLs are valid.
 *
 * @see https://next-intl.dev/docs/routing
 */
import { defineRouting } from "next-intl/routing";

import { DEFAULT_LOCALE, LOCALES } from "./config";

/**
 * Central routing configuration.
 *
 * Decisions made here and why:
 *
 * - `localePrefix: "always"` — every page lives under an explicit locale
 *   segment (`/en`, `/hi`, `/ml`, ...). Alternatives (`as-needed`) make
 *   the default locale reachable at bare `/`, which splits each page
 *   across two URLs and complicates CDN caching and hreflang. `always`
 *   keeps a strict 1:1 mapping between URL and rendered language.
 * - `localeDetection: true` — first-time visitors are routed by their
 *   `Accept-Language` header (with a cookie taking precedence on return
 *   visits) instead of always landing on English.
 * - `localeCookie` — a year-long, `SameSite=Lax` preference cookie so a
 *   user's explicit choice survives visits without affecting security
 *   posture (no cross-site data, no secrets).
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
  localeDetection: true,
  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  },
});
