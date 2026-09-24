# Architecture

This document explains how a request becomes a rendered, localized page — and why the
pieces are arranged the way they are.

## Request lifecycle

```text
Browser request: GET /hi/about
        │
        ▼
┌────────────────────────────────────────────────────────────────────┐
│ src/proxy.ts (Edge)                                                │
│ createMiddleware(routing)                                          │
│   1. URL carries a valid locale?  → pass through                   │
│   2. Else: NEXT_LOCALE cookie → Accept-Language → default locale   │
│      and 307-redirect to the prefixed URL                          │
│   3. Write the resolved locale back to the NEXT_LOCALE cookie      │
└────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────────┐
│ src/app/[locale]/layout.tsx (Server Component)                     │
│   - hasLocale() guard → 404 for unknown segments                   │
│   - setRequestLocale(locale) → opt into static rendering           │
│   - <html lang={locale} dir={getDirection(locale)}>                │
│   - NextIntlClientProvider serializes config to Client Components  │
└────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────────┐
│ src/i18n/request.ts (called by the next-intl plugin)               │
│   - hasLocale() fallback to the default locale                     │
│   - dynamic import of messages/<locale>.json                       │
│   - timeZone + named formats + onError + getMessageFallback        │
└────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────────┐
│ Page / component render                                            │
│   - Server: getTranslations() / getFormatter()                     │
│   - Client: useTranslations() / useFormatter() via the provider    │
│   - Navigation: Link / useRouter from src/i18n/navigation.ts       │
└────────────────────────────────────────────────────────────────────┘
```

## Module responsibilities

| Module                   | Owns                                                        | Must not know about        |
| ------------------------ | ----------------------------------------------------------- | -------------------------- |
| `src/i18n/config.ts`     | Locale codes, direction, labels, type guards                | React, next-intl, Next.js  |
| `src/i18n/routing.ts`    | Prefix policy, detection, cookie settings                   | Rendering, components      |
| `src/i18n/navigation.ts` | Locale-aware navigation primitives                          | Message content            |
| `src/i18n/request.ts`    | Messages, time zone, named formats, error policy            | URL shape                  |
| `src/proxy.ts`           | Locale detection at the Edge, URL normalization             | Rendering, messages        |
| `src/lib/seo.ts`         | Canonical/hreflang/absolute URL construction                | React, routing internals   |
| `src/app/**`             | Pages, metadata, document shell                             | Locale-list knowledge      |

The dependency direction is strictly one-way: `app → lib/i18n helpers → config`. Nothing in
`config.ts` imports anything from the app, which is what allows it to run unchanged in the
Edge proxy, in Server Components, in the browser bundle, and in Vitest.

## Rendering strategy: everything static, one locale at a time

`generateStaticParams` in `src/app/[locale]/layout.tsx` returns one entry per locale, and
`setRequestLocale` marks each request as statically renderable. The build therefore emits
static HTML for all six locales of every page:

```text
Route (app)
┌ ○ /_not-found
├   /[locale]
│ ├ ● /en      ├ ● /hi      ├ ● /ml      ├ ● /ta      ├ ● /kn      └ ● /ar
├ ƒ /[locale]/[...rest]     ← dynamic: renders the localized 404
├   /[locale]/about
│ ├ ● /en/about ... (six locales)
├ ○ /robots.txt
└ ○ /sitemap.xml
```

Two deliberate consequences:

- **The 404 route is dynamic.** `[...rest]` must be able to answer for arbitrary unknown
  paths, which by definition cannot be enumerated at build time. It renders the localized
  "not found" page with a real 404 status (asserted in `e2e/i18n-routing.spec.ts`).
- **The proxy still runs per request.** Static HTML does not remove the Edge hop: the proxy
  is what redirects `/` to `/en` (or to the cookie's locale) and what keeps unprefixed
  deep links working.

## Message catalogs

`messages/en.json` is the schema. The other five catalogs must mirror its key set exactly;
`src/i18n/messages.test.ts` enforces this and additionally:

1. compiles every message with `intl-messageformat` (catches ICU syntax errors at test time,
   not at render time),
2. asserts no catalog value is empty,
3. for every plural message, checks that the categories the locale actually uses
   (`Intl.PluralRules(locale).resolvedOptions().pluralCategories`) are present in the ICU
   message — this is what keeps Arabic's six forms honest.

Adding a message is therefore a two-file change (English + translation) that the test suite
validates, and adding a locale is a one-file change in `config.ts` plus a new catalog — see
[`i18n-guide.md`](i18n-guide.md).

## Time zone and hydration

Dates are formatted on the server (static HTML) and re-rendered on the client after
hydration. If the two sides used different time zones — server in UTC, browser in the
visitor's zone — React would report hydration mismatches. `src/i18n/request.ts` pins a single
explicit `timeZone` (`Asia/Kolkata` here) that both sides share. The same discipline applies
to relative time: the formatting demo passes an explicit `now` to the formatter, so
"1 day ago" cannot drift between render passes.

## SEO pipeline

One module, `src/lib/seo.ts`, owns every URL a crawler sees:

- `canonicalUrl(locale, path)` — the authoritative URL for a rendered page.
- `buildLanguageAlternates(path)` — the full hreflang map plus `x-default`.
- `absoluteUrl` / `localizedPath` / `normalizePathname` — the primitives those two build on.

Consumers:

- `src/app/[locale]/layout.tsx` sets `metadataBase` (so relative metadata URLs resolve) and
  the default title template.
- Each page's `generateMetadata` emits `alternates.canonical` and `alternates.languages`.
- `src/app/sitemap.ts` emits one `<url>` per locale per indexable route, each carrying the
  same `xhtml:link` alternate set.
- `src/app/robots.ts` allows crawling and advertises the sitemap.

Because the sitemap and the page metadata call the same helper, the hreflang sets can never
disagree — a class of bug that is invisible until a search engine picks the wrong language.

## Component architecture

Components follow the Component-as-a-Folder pattern: `Component.tsx` (implementation),
`index.ts` (public surface), `README.md` (what it is, why it exists, how to use it), and
`Component.test.tsx` (unit tests) where behavior warrants them. Server Components render all
static content; only genuinely interactive pieces (the language switcher, the plural counter)
are Client Components, so locale strings ship once.

## Directory conventions

```text
src/
  app/[locale]/        # Routes. The layout owns <html>; pages own content + metadata.
  components/<name>/   # One folder per component, README included.
  i18n/                # Locale identity, routing, navigation, request config.
  lib/                 # Framework-free helpers (SEO URL builders).
  proxy.ts             # Edge entry point.
messages/              # One catalog per locale; en.json is the schema.
e2e/                   # One spec per user-visible guarantee.
docs/                  # This document and its siblings.
content/               # Marketing kit; content/youtube/ holds the video pipeline.
```
