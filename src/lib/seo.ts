/**
 * @file SEO URL builders for a multilingual site.
 *
 * Search engines need three URL facts for every page of a multilingual
 * site, and all three are derived here so they can never disagree:
 *
 * 1. **Canonical URL** — the single authoritative address of a page in a
 *    given language (`/hi/about`).
 * 2. **hreflang alternates** — every language variant of that same page,
 *    plus an `x-default` entry pointing at the fallback language.
 * 3. **Absolute URLs** — hreflang values must be fully qualified, so the
 *    site origin is resolved once (env var, with a documented fallback)
 *    and reused everywhere.
 *
 * The helpers are pure string functions, which makes them trivially
 * unit-testable and safe to call from metadata generation, the sitemap,
 * robots, and structured data alike.
 */
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/config";

/**
 * Build-time origin of the deployed site.
 *
 * `NEXT_PUBLIC_SITE_URL` is inlined by Next.js at build time; the
 * fallback keeps local builds, previews, and the test suite deterministic
 * without requiring environment setup. A trailing slash is stripped so
 * `absoluteUrl` never emits a double slash.
 */
export const SITE_URL: string = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nextjs-i18n-demo.example.com",
);

/**
 * Removes trailing slashes from a site origin.
 *
 * @param raw - Origin such as `https://example.com/`.
 * @returns Origin without trailing slashes, e.g. `https://example.com`.
 */
function normalizeSiteUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

/**
 * Ensures a pathname starts with exactly one leading slash.
 *
 * Guards against callers passing `"about"` (no slash) or `"/about/"`;
 * the latter is normalized by the caller contract to be used without a
 * trailing slash, since canonical URLs for this site never end in `/`.
 *
 * @param pathname - Route path such as `/`, `/about`, or `about`.
 * @returns The pathname with a single leading slash.
 */
export function normalizePathname(pathname: string): string {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

/**
 * Joins the site origin with a route path to form an absolute URL.
 *
 * @param pathname - Route path such as `/` or `/about`.
 * @returns Fully qualified URL, e.g. `https://example.com/about`.
 */
export function absoluteUrl(pathname: string): string {
  return `${SITE_URL}${normalizePathname(pathname)}`;
}

/**
 * Prefixes a locale onto a route path.
 *
 * The root route is special-cased: `/` becomes `/hi`, not `/hi/`, because
 * the trailing slash is redundant and creates duplicate-URL ambiguity
 * for crawlers.
 *
 * @param locale - Target locale.
 * @param pathname - Locale-independent route path such as `/about`.
 * @returns Locale-prefixed path, e.g. `/hi/about`.
 */
export function localizedPath(locale: Locale, pathname: string): string {
  const normalized = normalizePathname(pathname);
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

/**
 * Builds the full hreflang alternate map for one logical page.
 *
 * The map contains one absolute URL per supported locale plus the
 * reserved `x-default` key, which tells crawlers which language to serve
 * when no language matches the visitor (here: the default locale).
 *
 * @param pathname - Locale-independent route path such as `/about`.
 * @returns Map of `hreflang` value to absolute URL.
 */
export function buildLanguageAlternates(pathname: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const locale of LOCALES) {
    alternates[locale] = absoluteUrl(localizedPath(locale, pathname));
  }
  alternates["x-default"] = absoluteUrl(localizedPath(DEFAULT_LOCALE, pathname));
  return alternates;
}

/**
 * Canonical absolute URL for one page in one locale.
 *
 * @param locale - The locale of the rendered page.
 * @param pathname - Locale-independent route path.
 * @returns Absolute canonical URL, e.g. `https://example.com/hi/about`.
 */
export function canonicalUrl(locale: Locale, pathname: string): string {
  return absoluteUrl(localizedPath(locale, pathname));
}
