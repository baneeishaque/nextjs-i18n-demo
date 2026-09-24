# Explainer: routing and rendering

A walkthrough of the Edge proxy, the localized layout, the pages, and the two files that make
unknown URLs and unknown locales behave correctly.

## `src/proxy.ts` — locale detection at the Edge

```ts
export default createMiddleware(routing);            // :31
export const config = { matcher: "/((?!api|_next|_vercel|.*\\..*).*)" };  // :46
```

Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`; the semantics are the same —
this module runs before routing, on every matched request, in the Edge runtime.

`createMiddleware(routing)` performs three jobs, in order:

1. **Detection.** No locale in the URL? Pick one — `NEXT_LOCALE` cookie first, then
   `Accept-Language` header, then the default — and 307-redirect to the prefixed URL. The
   cookie wins over the header because an explicit choice outranks a guess.
2. **Pass-through.** A URL that already carries a valid locale proceeds untouched; no
   redirect, no re-render cost.
3. **Cookie sync.** The resolved locale is written back to `NEXT_LOCALE`, so a detected
   language sticks on the next visit.

The matcher excludes exactly four things, each for a concrete reason:

| Excluded                | Why                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `api`                   | Endpoints return data; a locale prefix would corrupt the route                       |
| `_next`                 | Framework chunks (JS/CSS/images) — prefixing them 404s the page                      |
| `_vercel`               | Platform endpoints (analytics, speed insights)                                       |
| anything with a dot     | Static files (`/favicon.ico`, `/robots.txt`, `/sitemap.xml`) — extensions are files, not pages |

Everything else — every page route — flows through detection. The handler does header and
cookie inspection only: no filesystem, no network, no database, which is what keeps the Edge
hop latency-negligible.

## `src/app/[locale]/layout.tsx` — the document shell

There is no `app/layout.tsx`: because every user-visible route lives under `[locale]`, this
file *is* the root layout, and it owns the `<html>` element.

```ts
export function generateStaticParams() {                 // :56
  return routing.locales.map((locale) => ({ locale }));
}
```

- One static entry per locale. Combined with `localePrefix: "always"`, the build emits
  `/en`, `/hi`, `/ml`, `/ta`, `/kn`, `/ar` — and every nested page — as static HTML. In
  production those requests never run React.

```ts
const { locale } = await params;                          // :101
if (!hasLocale(routing.locales, locale)) { notFound(); }  // :106
setRequestLocale(locale);                                 // :113
```

- **`await params`** — Next.js 16 hands route params in as a Promise; reading `.locale`
  without awaiting is the most common App Router upgrade bug.
- **The `hasLocale` guard** turns `/xx/about` into a 404 instead of letting an unknown
  locale flow into message loading (where it would produce a `⚠`-riddled page or a crash).
  `notFound()` here renders the nearest `not-found.tsx` — which, for paths under
  `[locale]`, is the localized one.
- **`setRequestLocale(locale)`** is what *opts this request into static rendering*. Without
  it, next-intl would read the locale from request headers at render time and Next.js would
  silently fall back to dynamic rendering for every page — the build output would still
  look fine locally and lose all CDN benefits in production.

```tsx
<html lang={locale} dir={getDirection(locale)}>           // :116
  <body className="flex min-h-dvh flex-col">
    <NextIntlClientProvider>
      <SiteHeader />
      <main id="main-content" className="flex-1">{children}</main>
      <SiteFooter />
    </NextIntlClientProvider>
  </body>
</html>
```

- `lang` drives screen-reader pronunciation, browser translation prompts, and search
  indexing; `dir` mirrors the document for Arabic. Because every layout utility in the app
  is a CSS logical property (`ps-*`, `me-*`, `text-start`), this one attribute mirrors the
  entire UI with no per-locale CSS.
- `<NextIntlClientProvider>` with no props is intentional: it inherits locale, messages,
  formats, and time zone from `request.ts` through the server render, serializes them for
  Client Components, and guarantees both sides share one configuration.
- `min-h-dvh` + `flex-1` on `<main>` keeps the footer at the bottom on short pages;
  `id="main-content"` is the skip-link target from the header.

```ts
export async function generateMetadata({ params }) {                    // :70
  const t = await getTranslations<"Metadata">({ locale, namespace: "Metadata" });  // :81
  return { metadataBase: new URL(SITE_URL), title: { default: ..., template: `%s | ${...}` }, ... };
}
```

- **The explicit `<"Metadata">` generic is load-bearing.** In the object-form overload,
  TypeScript widens the `namespace` property to `string`, which degrades every message key
  to `never` and silently accepts typos. The generic pins the namespace so keys are checked
  against the English catalog.
- `metadataBase` is what lets every page emit *relative* canonical/alternate URLs that
  Next.js resolves against the production origin — one place to change the domain.

## `src/app/[locale]/page.tsx` and `about/page.tsx` — the page pattern

Both pages follow the same four-step shape:

```ts
const { locale } = await params;                          // 1. read the segment
if (!isLocale(locale)) notFound();                        // 2. narrow it (runtime guard)
setRequestLocale(locale);                                 // 3. opt into static rendering
const t = await getTranslations("HomePage");              // 4. load messages
```

`generateMetadata` in each page adds the SEO layer — canonical URL plus the full hreflang
set — from `src/lib/seo.ts`, so the page and the sitemap can never disagree:

```ts
alternates: {
  canonical: canonicalUrl(locale, "/about"),
  languages: buildLanguageAlternates("/about"),
}
```

Catalog lookups are driven by literal tuples (`FEATURE_KEYS`, `MECHANISM_KEYS`) so mapped
keys like `features.${key}.title` stay type-checked: the tuple constrains `key` to the four
known feature names, and the `Messages` augmentation validates the resulting path.

## `not-found.tsx` + `[...rest]/page.tsx` — localized 404s

The subtlety: Next's default not-found lives *outside* the `[locale]` segment and therefore
cannot read the message catalog — a Hindi visitor would get an English 404.

```tsx
export default async function CatchAllPage({ params }) {   // [...rest]/page.tsx :28
  const { locale } = await params;
  if (isLocale(locale)) { setRequestLocale(locale); }
  notFound();
}
```

- The catch-all route matches every unknown path under a valid locale and immediately calls
  `notFound()`. Because the call happens *inside* the `[locale]` tree, the 404 is rendered
  by `[locale]/not-found.tsx` — which uses `useTranslations` and therefore speaks the
  visitor's language.
- `setRequestLocale` is called first so the 404 page renders statically where possible;
  the `isLocale` guard keeps the function total for malformed input.
- `e2e/i18n-routing.spec.ts` asserts both halves: HTTP **status 404** and localized 404
  copy for `/ml/definitely-not-a-page`.

## `global.d.ts` — typed messages and locales

```ts
import { routing } from "@/i18n/routing";
import messages from "../messages/en.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
```

- Declaring `AppConfig` upgrades every next-intl API from `string`-keyed to fully typed:
  `t("HomePage.heroTitel")` becomes a compile error, and passing `"fr"` to a locale-aware
  API fails the build.
- **The imports must be value imports, not `import type`.** `typeof` on a type-only import
  does not reliably resolve the JSON module shape, and the failure mode is silent: every
  message key degrades to `never` and the compiler starts rejecting *correct* code. The
  comment in the file records this so nobody "optimizes" the imports later.
- The English catalog is the schema; `messages.test.ts` verifies the other five catalogs
  against it, so typing and tests enforce the same contract from two directions.

## The rendering matrix, end to end

```text
/hi/about
  → proxy: valid locale, pass through
  → layout: hasLocale ok, setRequestLocale, <html lang="hi" dir="ltr">
  → about/page: isLocale ok, setRequestLocale, messages from messages/hi.json
  → generateMetadata: canonical /hi/about + 7 hreflang links
  → static HTML from the build (no React at request time)
```
