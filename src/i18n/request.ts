/**
 * @file Per-request i18n configuration (messages, formats, time zone).
 *
 * The Next.js plugin registered in `next.config.ts` points here. For every
 * incoming request next-intl calls this factory with the locale resolved
 * by the middleware, and the returned object becomes the configuration
 * available to Server Components (`getTranslations`, `getFormatter`) and
 * — serialized — to Client Components via `NextIntlClientProvider`.
 *
 * @see https://next-intl.dev/docs/usage/configuration
 */
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

/**
 * Default time zone for all date/time formatting.
 *
 * Setting this explicitly is what makes server-rendered dates and
 * client-hydrated dates agree: without it the server would format in the
 * host's zone (UTC in production containers) while the browser formats in
 * the visitor's zone, producing React hydration mismatches. The demo uses
 * the community's home zone; real products typically resolve this from a
 * user profile with the same explicit-value discipline.
 */
const DEFAULT_TIME_ZONE = "Asia/Kolkata";

/**
 * Named, reusable format presets.
 *
 * Centralizing them here means a design change ("dates always show the
 * weekday") is one edit that applies to every locale and every caller,
 * and it keeps page components free of raw `Intl` option objects.
 */
const formats = {
  dateTime: {
    /** `14 Mar 2026` — compact form for tables and cards. */
    short: { day: "numeric", month: "short", year: "numeric" },
    /** `Saturday, 14 March 2026 at 10:30` — long form for detail views. */
    long: {
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    },
  },
  number: {
    /** At most two fraction digits — the money-friendly default. */
    precise: { maximumFractionDigits: 2 },
  },
} as const;

/**
 * Request configuration factory consumed by next-intl.
 *
 * Contract:
 * 1. `requestLocale` is whatever the middleware resolved; it may be
 *    `undefined` (e.g. static generation of a route without a locale) or
 *    an arbitrary string (hand-crafted URL). Both cases fall back to the
 *    default locale via the `hasLocale` guard — the runtime equivalent of
 *    the `isLocale` type guard.
 * 2. Messages are loaded with a dynamic `import()` per locale, so only
 *    the active language's catalog is bundled for a given page.
 * 3. `onError` fails fast on programming errors (bad ICU syntax) but
 *    degrades gracefully on missing keys — a missing translation should
 *    never take a page down, yet it must be loud in development.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: DEFAULT_TIME_ZONE,
    formats,
    onError(error) {
      if (error.code === "MISSING_MESSAGE") {
        // Missing translations are recoverable: the fallback below renders
        // a visibly-wrong-but-safe string, and the console keeps the gap
        // discoverable in development and in server logs.
        console.error(`[i18n] ${error.message}`);
      } else {
        // Anything else (invalid ICU syntax, wrong argument shape) is a
        // bug in the catalog or the call site — fail fast in every env.
        throw error;
      }
    },
    getMessageFallback({ namespace, key, error }) {
      const path = [namespace, key].filter(Boolean).join(".");
      return error.code === "MISSING_MESSAGE" ? `⚠ ${path}` : `⚠ ${path}`;
    },
  };
});
