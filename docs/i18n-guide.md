# i18n guide

Everything a contributor needs to add a language, add a message, or debug a locale bug.

## The locale single source of truth

`src/i18n/config.ts` is the only place that knows which locales exist. It exports:

| Export                  | Type                        | Use                                                        |
| ----------------------- | --------------------------- | ---------------------------------------------------------- |
| `LOCALES`               | `readonly ["en", ...]`      | Iterating every locale (sitemap, tests, switcher)          |
| `Locale`                | `"en" \| "hi" \| ...`       | The union derived from `LOCALES` — never hand-written      |
| `DEFAULT_LOCALE`        | `Locale`                    | Fallback when nothing matches; the `x-default` target      |
| `RTL_LOCALES`           | `readonly Locale[]`         | Locales rendered right-to-left                             |
| `isLocale(value)`       | type guard                  | Narrowing untrusted input (URL segments, cookies)          |
| `isRtlLocale(locale)`   | predicate                   | Direction checks in logic                                  |
| `getDirection(locale)`  | `"ltr" \| "rtl"`            | The `<html dir>` value                                     |
| `getLocaleLabel(locale)`| `string`                    | Native name for the switcher (`"മലയാളം"`)                  |
| `getLocaleEnglishName`  | `string`                    | English name for machine-readable surfaces                 |

Two rules keep the design honest:

1. **Never write a locale union by hand.** `Locale` is derived from `LOCALES`; a hand-written
   union can drift and the compiler stops being able to prove exhaustiveness.
2. **Always narrow untrusted input.** Anything arriving from a URL, cookie, or header is
   `string`, not `Locale`. Pass it through `isLocale()` (runtime, app code) or
   `hasLocale(routing.locales, value)` (next-intl request config).

## Adding a locale

Checklist — one file change plus one catalog:

1. Add the code to `LOCALES` in `src/i18n/config.ts` (in display order).
2. Add its native label to `LOCALE_LABELS` and its English name to `LOCALE_ENGLISH_NAMES`.
   The `Record<Locale, string>` types force this — the compiler fails until both maps are
   complete.
3. If it is right-to-left, add it to `RTL_LOCALES`.
4. Create `messages/<code>.json` mirroring `messages/en.json` key for key.
5. Run `npm test` — `messages.test.ts` verifies key parity, non-empty values, ICU syntax,
   and plural-category coverage for the new locale.
6. Run `npm run build` — `generateStaticParams` picks the locale up automatically and the
   sitemap grows by two entries per route.

No component, page, or proxy change is needed: every consumer iterates `LOCALES`.

## Adding or changing a message

1. Edit `messages/en.json` (the schema).
2. Mirror the key in every other catalog. Missing keys do not crash the app — the request
   config's `getMessageFallback` renders `⚠ Namespace.key` — but `messages.test.ts` will
   fail, so the gap cannot ship silently.
3. Prefer named formats from `src/i18n/request.ts` (`dateTime.short`, `number.precise`) over
   inline `Intl` options so a formatting change is one edit.
4. Run `npm test`.

### ICU patterns used in this repository

**Interpolation** — values are named, never positional:

```json
{ "option": "Switch to {language}" }
```

**Plurals** — always use the `plural` construct, never string concatenation:

```json
{ "items": "{count, plural, =0 {No items in the cart} one {# item in the cart} other {# items in the cart}}" }
```

Notes:

- `=0` is an exact-match branch: it wins over the category rules and gives a natural
  "No items in the cart" instead of "0 items in the cart".
- `#` renders the count with the locale's number formatting — Arabic shows Eastern Arabic
  numerals (٣) automatically.
- English needs `one` and `other`. Arabic needs six forms; the full Arabic message is:

```json
{ "items": "{count, plural, =0 {لا عناصر في السلة} zero {لا عناصر في السلة} one {عنصر واحد في السلة} two {عنصران في السلة} few {# عناصر في السلة} many {# عنصرًا في السلة} other {# عنصر في السلة}}" }
```

`messages.test.ts` checks exactly this: for each plural message, every category reported by
`Intl.PluralRules(locale).resolvedOptions().pluralCategories` must appear in the message.

## Formatting rules

All formatting goes through next-intl's `useFormatter` / `getFormatter`, which delegate to
the platform `Intl` APIs with the locale and the configured time zone.

```tsx
const format = useFormatter();
format.dateTime(new Date(), "long");       // named format from request.ts
format.number(1234567.89);                 // locale grouping (12,34,567.89 in hi)
format.number(4999.5, "currency", "INR");  // ₹4,999.50 / ٤٬٩٩٩٫٥٠ ر.س style output
format.percent(0.42);                      // 42%
format.relativeTime(earlier, now);         // "1 day ago" — always pass an explicit now
```

Two hard-won rules:

1. **Never format dates or relative times without an explicit time zone / `now`.** Server
   and client must compute identical strings or React reports a hydration mismatch.
   `src/i18n/request.ts` sets the time zone once for the whole app; relative time callers
   pass `now` explicitly (see `FormattingDemo.tsx`).
2. **Do not hardcode expectations in tests.** The test suites compute expected strings with
   the platform `Intl` APIs and `intl-messageformat` — the same engines the app uses — so
   CLDR updates cannot silently invalidate an assertion.

## RTL rules

- Direction is applied once, in `src/app/[locale]/layout.tsx`:
  `<html lang={locale} dir={getDirection(locale)}>`.
- All layout utilities must be **logical**: `ps-*` / `pe-*` (padding), `ms-*` / `me-*`
  (margin), `start-*` / `end-*` (position), `text-start` / `text-end`. Physical utilities
  (`pl-*`, `left-*`) break Arabic silently — they look fine in English and are wrong in RTL.
- Icons that imply direction (arrows, chevrons) need `rtl:rotate-180` or an RTL variant.
- The E2E suite asserts *geometry*, not just the attribute: `e2e/rtl.spec.ts` compares the
  header bounding boxes in `/en` and `/ar` and fails unless the navigation and switcher swap
  sides.

## URL policy

`localePrefix: "always"` — every page is reachable only under its locale prefix. The trade-off
(a redirect for unprefixed deep links) buys a strict 1:1 mapping between URL and rendered
language, which keeps CDN caches, canonical URLs, and hreflang honest. See
[`trade-offs.md`](trade-offs.md).

Detection order in the proxy: `NEXT_LOCALE` cookie → `Accept-Language` → default locale. The
switcher writes the cookie on every explicit choice, so a user's decision always beats the
header on return visits (asserted in `e2e/language-switcher.spec.ts`).

## Pitfalls this codebase already solved

| Symptom                                                              | Cause                                                                                                 | Fix                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Message keys resolve to `never` in TS                                | Object-form `getTranslations({locale, namespace})` widens `namespace` to `string`                     | Explicit generic: `getTranslations<"Metadata">({ locale, namespace: "Metadata" })` |
| `middleware.ts` is ignored in Next 16                                | The convention was renamed                                                                             | `src/proxy.ts` with the same default export and matcher                          |
| Hydration mismatch on dates                                          | Server and browser formatted in different time zones                                                   | Explicit `timeZone` in `src/i18n/request.ts`                                     |
| Sitemap and page metadata disagree on hreflang                       | Two hand-built URL sets                                                                                | One `buildLanguageAlternates()` used by both                                     |
| Unknown locale (`/xx`) crashes message loading                       | Locale used before validation                                                                          | `hasLocale()` guard in layout and request config → 404                           |
| Static rendering silently becomes dynamic                            | Locale read from request headers at render time                                                        | `setRequestLocale(locale)` in the layout                                         |
| Selecting the active language in the switcher triggers a navigation   | jsdom (and some browsers) fire `change` even when the value did not change                             | Guard: `if (nextLocale === locale) return;` in the change handler                |

## Verifying a locale change

```bash
npm test            # catalog parity, ICU syntax, plural coverage
npm run test:e2e    # routing, RTL geometry, switcher, SEO, formatting in a browser
npm run build       # confirms the new locale statically generates
```
