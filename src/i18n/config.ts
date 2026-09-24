/**
 * @file Locale identity constants and pure helpers.
 *
 * This module is the **single source of truth** for every question of the
 * shape "which locales does this application speak, and what are their
 * characteristics?". All other i18n modules (`routing.ts`, `request.ts`,
 * `middleware.ts`, UI components, tests, sitemap, and metadata builders)
 * import their locale data from here so that adding a language is a
 * one-file change plus one message catalog.
 *
 * Design notes:
 * - `LOCALES` is declared `as const`, so TypeScript derives the `Locale`
 *   union (`"en" | "hi" | "ml" | "ta" | "kn" | "ar"`) from the array
 *   itself. A locale can therefore never be added to one place and
 *   forgotten in another — the compiler enforces exhaustiveness.
 * - Helpers are intentionally pure and dependency-free so they can run in
 *   the Edge middleware, React Server Components, the client bundle, and
 *   Vitest without any shims.
 */

/**
 * Every locale the application ships, in display order.
 *
 * Order rationale: the default locale first, then Indian languages
 * (Hindi, Malayalam, Tamil, Kannada), then Arabic last so the RTL entry
 * sits adjacent to the LTR entries it is contrasted with in the switcher.
 */
export const LOCALES = ["en", "hi", "ml", "ta", "kn", "ar"] as const;

/**
 * Union type of all supported locale codes.
 *
 * Derived from {@link LOCALES} — never write this union by hand, or the
 * compiler can no longer guarantee that every locale is handled.
 */
export type Locale = (typeof LOCALES)[number];

/**
 * Locale used when no user preference can be determined (no cookie, no
 * `Accept-Language` match). Also the `x-default` target for hreflang.
 */
export const DEFAULT_LOCALE: Locale = "en";

/**
 * Locales written right-to-left. Declared as a typed subset of
 * {@link LOCALES} so a typo like `"ur"` fails at compile time instead of
 * silently producing a locale that is never in the switcher.
 */
export const RTL_LOCALES = ["ar"] as const satisfies readonly Locale[];

/**
 * Type guard answering "is this arbitrary runtime value one of our locales?".
 *
 * This is the boundary check used by middleware, layouts, and sitemap
 * builders: URL segments and cookies are untrusted input, and narrowing
 * them to {@link Locale} is what makes every downstream call type-safe.
 *
 * @param value - Any value, typically a URL segment or cookie string.
 * @returns `true` when `value` is a supported locale code.
 */
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Answers "does this locale render right-to-left?".
 *
 * @param locale - A supported locale.
 * @returns `true` for RTL locales (currently only Arabic).
 */
export function isRtlLocale(locale: Locale): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}

/**
 * Maps a locale to the HTML `dir` attribute value.
 *
 * Used once per request in the `[locale]` layout's `<html>` element; the
 * browser then mirrors the entire document and Tailwind's logical
 * properties (`ps-*`, `me-*`, `text-start`, ...) follow automatically.
 *
 * @param locale - A supported locale.
 * @returns `"rtl"` for right-to-left locales, otherwise `"ltr"`.
 */
export function getDirection(locale: Locale): "ltr" | "rtl" {
  return isRtlLocale(locale) ? "rtl" : "ltr";
}

/**
 * Native-language display name for each locale, shown in the switcher so
 * users recognize their language without needing a translation first
 * (the W3C-recommended practice for language menus).
 */
const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  ml: "മലയാളം",
  ta: "தமிழ்",
  kn: "ಕನ್ನಡ",
  ar: "العربية",
};

/**
 * English name for each locale, used in machine-readable surfaces
 * (`<link rel="alternate">` titles, structured data, logs) where a
 * language-neutral identifier is expected.
 */
const LOCALE_ENGLISH_NAMES: Record<Locale, string> = {
  en: "English",
  hi: "Hindi",
  ml: "Malayalam",
  ta: "Tamil",
  kn: "Kannada",
  ar: "Arabic",
};

/**
 * Returns the locale's self-referential (native) label.
 *
 * @param locale - A supported locale.
 * @returns The language name written in that language, e.g. `"മലയാളം"`.
 */
export function getLocaleLabel(locale: Locale): string {
  return LOCALE_LABELS[locale];
}

/**
 * Returns the locale's English name.
 *
 * @param locale - A supported locale.
 * @returns The language name in English, e.g. `"Malayalam"`.
 */
export function getLocaleEnglishName(locale: Locale): string {
  return LOCALE_ENGLISH_NAMES[locale];
}
