# Testing

The suite is a two-layer pyramid: fast Vitest tests for logic and components, and a Playwright
suite that exercises the real routing stack against a production build. Every claim in the
README is backed by a named test.

## Running

```bash
npm test              # unit + component tests (Vitest, jsdom)
npm run test:watch    # same, in watch mode
npm run test:coverage # with V8 coverage
npm run test:e2e      # builds first (pretest:e2e), then Playwright/Chromium
npm run test:e2e:ui   # Playwright UI mode for debugging
```

First E2E run needs the browser: `npx playwright install chromium`.

## Layer 1 — Vitest (45 tests)

| File                                              | Covers                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/i18n/config.test.ts`                         | Locale SSOT: every locale has a label and direction, `isLocale` accepts/rejects, RTL set   |
| `src/i18n/messages.test.ts`                       | Catalog parity vs `en.json`, non-empty values, ICU compilation, plural-category coverage   |
| `src/lib/seo.test.ts`                             | URL builders: normalization, locale prefixes, alternates incl. `x-default`, canonical URLs  |
| `src/components/language-switcher/…test.tsx`      | Renders every locale natively labeled, reflects the active value, navigates via `replace`  |
| `src/components/formatting-demo/…test.tsx`        | Date/number/currency/percent/relative formatting, plural branches incl. Arabic dual form    |

Design rules that keep these tests trustworthy:

- **Expected values are computed, not hardcoded.** The formatting tests build expectations
  with the platform `Intl` APIs and `intl-messageformat` — the same engines the components
  use — so a CLDR data update changes both sides together.
- **The navigation layer is mocked at the module boundary** (`vi.mock("@/i18n/navigation")`,
  `vi.hoisted` for the spy), so the switcher test asserts the component's contract — path
  preserved, `{ locale }` passed — while real navigation is proven in E2E.
- **Catalogs are the fixtures.** Tests import `messages/*.json` directly; there is no
  duplicated fixture copy that can drift.

## Layer 2 — Playwright (21 tests, Chromium)

The E2E suite runs against `next build` output served by `next start` on port 3100 — not
`next dev` — because static generation, proxy redirects, and cookie behavior are part of what
is being verified. `playwright.config.ts` starts the server automatically.

| Spec                        | Guarantees                                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `e2e/i18n-routing.spec.ts`  | `/` redirects to `/en`; all six locales render their hero; locale prefix survives navigation; localized 404 (status 404); `Accept-Language: hi-IN` lands on `/hi`; pages render **without JavaScript** (SSR/SSG proof) |
| `e2e/rtl.spec.ts`           | `lang`/`dir` on `<html>` for `en` and `ar`; header geometry **mirrors** (nav and switcher swap sides)                   |
| `e2e/language-switcher.spec.ts` | Switching preserves the route (`/en/about` → `/hi/about`); `NEXT_LOCALE` cookie is written; the cookie beats the header on the next visit to `/` |
| `e2e/seo.spec.ts`           | Canonical per page; hreflang set = six locales + `x-default`; sitemap has 12 `<url>` entries with alternates; robots advertises the sitemap; titles are localized |
| `e2e/formatting.spec.ts`    | The **browser's** `Intl` output matches the reference implementation for Hindi and Arabic, including the Arabic dual plural form driven through the UI |

Cross-context tests (`Accept-Language`, JavaScript disabled) create their own
`browser.newContext(...)` so they do not leak locale or scripting settings into other tests.

## CI

`.github/workflows/ci.yml` runs two parallel jobs on every push to `main` and every pull
request:

1. **quality** — `npm ci`, ESLint, `tsc --noEmit`, unit tests with coverage, markdownlint.
2. **e2e** — `npm ci`, Chromium install (`--with-deps`), `npm run test:e2e` (which builds
   first), Playwright report uploaded as an artifact even on failure.

Node 24 in CI; the repo engines floor is Node 20.

## Adding a test

- **Logic or component change** → extend the matching Vitest file; keep expectations computed
  from the same source of truth as the implementation.
- **Routing, SEO, direction, or cookie change** → extend the matching E2E spec; assert
  observable behavior (URLs, attributes, geometry, HTTP status), not implementation details.
- **New user-visible guarantee** → new spec file, one guarantee per file, catalog-driven
  strings only (import `messages/*.json` — never retype translated text).
