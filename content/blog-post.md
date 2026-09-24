# One codebase, six languages, zero layout forks: multilingual Next.js done properly

*Canonical article for the blog / dev.to / Hashnode. Syndicate to Medium with a canonical link
back to this URL.*

There is a moment every product team hits: the first non-English user shows up, and the
roadmap gets a new line item called "i18n." What follows is usually a scramble — URL
strategy debated in one meeting, pluralization bugs discovered in another, and a right-to-left
audit scheduled for a quarter that never arrives.

This article walks through a reference implementation that answers those questions up front:
six languages (English, Hindi, Malayalam, Tamil, Kannada, and Arabic), a real RTL locale, ICU
plurals with Arabic's six-form plural rules, multilingual SEO, and a test suite that proves
all of it. The full source is here:

**Repository: [github.com/baneeishaque-ompventure/nextjs-i18n-demo](https://github.com/baneeishaque-ompventure/nextjs-i18n-demo)**

## The decisions that matter (and the ones that don't)

Multilingual architecture is mostly five decisions. Everything else is execution.

**1. Every page lives under a locale prefix — always.** `/en/about`, `/hi/about`,
`/ar/about`. Not "English at the bare path." The alternative (`as-needed` prefixes) is
seductive because English URLs stay pretty, but it creates two addresses for every English
page, doubles your cache keys, and forces special cases into canonical-URL logic. One URL per
language is a rule you never have to think about again. The cost is one redirect for an
unprefixed deep link — handled at the edge, invisible in practice.

**2. Detect the language at the edge, not in the browser.** A visitor's first request should
already be in their language. The detection order is: explicit preference cookie, then the
`Accept-Language` header, then the default. Cookie first matters — an explicit choice must
outrank a guess on every subsequent visit. In this codebase that logic is a dozen lines in
`src/proxy.ts`; the E2E suite proves a browser sending `Accept-Language: hi-IN` lands on
`/hi`, and that a stored preference beats the header on the next visit.

**3. Generate the pages statically, per locale.** Six locales times two routes equals twelve
static HTML pages — no React at request time, all served from the CDN. This forces one
discipline: every place that reads the locale must mark the render as static (in next-intl
that is `setRequestLocale`). Forget it and the build silently falls back to dynamic
rendering. Nothing breaks; you just quietly lose the CDN. Worth a build-output assertion in
code review.

**4. One source of truth for locale facts.** Which languages exist, which are
right-to-left, what each language calls itself — that is one module, and TypeScript derives
the union type from the array. Adding Bengali should be a one-line change plus one message
catalog, and the compiler should refuse to build until the labels, direction data, and
catalog are complete. In this project it does.

**5. Treat the catalog as a schema, not a file.** The English catalog defines the shape.
Every other catalog is verified against it by a test: same keys, no empty values, every
message compiles as valid ICU, and — the interesting one — every plural message contains
every plural category the locale actually uses.

## RTL is a layout decision, not a translation task

Here is the uncomfortable truth about right-to-left support: if you built the app with
physical CSS (`padding-left`, `margin-right`, `left: 0`), Arabic will look broken no matter
how good the translation is. Retrofitting RTL means auditing every stylesheet.

If you build with logical properties (`padding-inline-start`, `margin-inline-end`,
`inset-inline-start`) and Tailwind's logical utilities (`ps-*`, `me-*`, `start-*`,
`text-start`), then flipping the entire UI is one attribute:

```tsx
<html lang={locale} dir={getDirection(locale)}>
```

One attribute. The entire document mirrors — navigation, spacing, alignment, icons that use
direction-aware transforms.

And here is how you prove it, instead of hoping: assert the geometry. The E2E test compares
the bounding boxes of the navigation and the language switcher in `/en` and `/ar` and fails
unless the two elements have swapped sides. A test that only checks `dir="rtl"` is a test
that passes on a broken layout.

## Pluralization is where hand-rolled i18n dies

English has two plural forms. Hindi, Malayalam, Tamil, and Kannada have two. Arabic has
**six**: zero, one, two, few, many, other. If your i18n code is string concatenation plus a
`count === 1` check, Arabic will be wrong in ways native speakers notice immediately.

The fix is ICU message format — a small declarative language for messages with variables,
plurals, and selects:

```json
{
  "items": "{count, plural, =0 {No items in the cart} one {# item in the cart} other {# items in the cart}}"
}
```

The same message in Arabic:

```json
{
  "items": "{count, plural, =0 {لا عناصر في السلة} zero {لا عناصر في السلة} one {عنصر واحد في السلة} two {عنصران في السلة} few {# عناصر في السلة} many {# عنصرًا في السلة} other {# عنصر في السلة}}"
}
```

Note `#` — it renders the count using the locale's own number formatting. Arabic shows
Eastern Arabic numerals (٣) automatically. The demo page has a live counter; switch the
language and watch the sentence, the numerals, and the plural category change together.

The test suite enforces this structurally: for every plural message, the test asks the
platform (`Intl.PluralRules`) which categories Arabic uses and fails if the message does not
cover all six. A translator cannot accidentally ship an English-shaped Arabic message.

## The hydration trap nobody warns you about

Server-render a date, hydrate it in the browser, and if the two sides disagree about the time
zone, React reports a hydration mismatch. It happens because the server formats in the
container's zone (usually UTC) while the browser formats in the visitor's zone.

The fix is a single explicit time zone shared by both sides:

```ts
const DEFAULT_TIME_ZONE = "Asia/Kolkata";
```

Set once in the request configuration, it applies to every date on every page, server and
client. The same discipline applies to relative time ("1 day ago"): always pass an explicit
`now` so the string cannot drift between renders. Small rules, but they are the difference
between a demo and something you can ship.

## Multilingual SEO in one module

Search engines need three things for a multilingual site, and the classic bug is that the
sitemap and the pages disagree about them:

- **Canonical URL** — the one authoritative address per language.
- **hreflang alternates** — every language variant of the page, plus `x-default`.
- **Sitemap** — all indexable URLs with their alternate sets.

The structural fix: one module computes all three, and every consumer calls it. The sitemap
entry and the page's `<link rel="alternate">` tags come from the same function, so they
cannot drift. Adding a language grows every alternate set and the sitemap automatically,
because the code iterates the locale list instead of listing languages by hand.

The E2E suite asserts the real output: canonical per page, exactly seven alternate links
(six locales plus `x-default`), twelve sitemap entries, and a robots file that advertises the
sitemap.

## Tests that would catch a real regression

The suite is 45 unit and component tests plus 21 end-to-end tests, and the split is
deliberate:

- **Unit** (Vitest) — catalog parity, ICU validity, plural coverage, URL builders, and the
  interactive components with mocked navigation.
- **E2E** (Playwright, against a production build) — routing redirects, locale detection
  from headers, cookie persistence, RTL geometry, SEO output, and formatting in a real
  browser.

Two testing rules worth stealing:

1. **Compute expected values; never hardcode formatted strings.** The tests derive expected
   output from `Intl` and `intl-messageformat` — the same engines the app uses. A CLDR data
   update moves both sides together instead of breaking the suite.
2. **Assert behavior, not implementation.** The RTL test asserts mirrored geometry, not the
   `dir` attribute. The detection test sends a real `Accept-Language` header through a real
   browser context, not a mocked function.

One more test earns its keep in a surprising way: the suite renders pages with **JavaScript
disabled** and asserts the content and formatting are present. That is the strongest
possible statement that the site is genuinely server-rendered — and it catches an entire
category of "works on my machine with fast JS" regressions.

## What this costs

Honesty about trade-offs is what separates architecture from advocacy:

- **A redirect on first visit** to unprefixed URLs — the price of strict one-URL-per-language.
- **Detection can guess wrong.** The switcher makes correcting it a one-click action, and the
  cookie remembers the correction.
- **Static generation means a rebuild for content changes** — the right call when content
  lives in catalogs; the wrong call for a CMS-driven news site without revalidation.
- **Library coupling.** This project uses next-intl; the usage is confined to a handful of
  modules so the blast radius of a swap is small.

## Steal the checklist

If you are about to add i18n to a Next.js app, this is the short version:

1. Locale-prefixed URLs, always.
2. Edge detection: cookie, then header, then default.
3. One module owns locale facts; derive types from data.
4. Logical CSS properties from day one; flip direction with one attribute.
5. ICU messages for anything with a number in it; test plural categories per locale.
6. One explicit time zone shared by server and client.
7. One module owns canonical/hreflang/sitemap URLs.
8. Assert RTL geometry and no-JS rendering in E2E, not just the happy path.

The repository implements all eight, with the reasoning written down next to the code — every
module has a line-by-line explainer in `docs/`, and the `content/` directory contains the kit
that produced this article, including a six-language video pipeline.

**Code: [github.com/baneeishaque-ompventure/nextjs-i18n-demo](https://github.com/baneeishaque-ompventure/nextjs-i18n-demo)**

If you build something with it, the issue tracker is open — especially if you find a locale
where the plural rules surprise you. Arabic's dual form is just the beginning.
