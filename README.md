# nextjs-i18n-demo

An industrial multilingual showcase built with the Next.js App Router and
[next-intl](https://next-intl.dev): six languages (including a right-to-left script and four
Indian scripts), ICU formatting with real CLDR plural rules, multilingual SEO, statically
generated pages, and a full unit + end-to-end test matrix.

The repository doubles as a reference implementation: every architectural decision is
documented in [`docs/`](docs/), every source file carries doc comments, and the
[`content/`](content/) directory ships the complete content-marketing kit that presents the
project (blog, social posts, and a multilingual YouTube video pipeline).

## Languages shipped

| Locale | Language   | Script     | Direction | CLDR plural categories            |
| ------ | ---------- | ---------- | --------- | --------------------------------- |
| `en`   | English    | Latin      | LTR       | `one`, `other`                    |
| `hi`   | Hindi      | Devanagari | LTR       | `one`, `other`                    |
| `ml`   | Malayalam  | Malayalam  | LTR       | `one`, `other`                    |
| `ta`   | Tamil      | Tamil      | LTR       | `one`, `other`                    |
| `kn`   | Kannada    | Kannada    | LTR       | `one`, `other`                    |
| `ar`   | العربية    | Arabic     | **RTL**   | `zero`, `one`, `two`, `few`, `many`, `other` |

Arabic is the interesting case on purpose: it is the only RTL locale, and its six plural
categories exercise ICU machinery that English-style catalogs never touch.

## Features

- **Locale-prefixed routing** — every page lives under an explicit locale segment (`/en`,
  `/hi/about`, ...) with `Accept-Language` detection, a `NEXT_LOCALE` preference cookie, and
  redirects handled in the Edge proxy.
- **Static generation** — all locale/page combinations are pre-rendered at build time
  (`generateStaticParams` + `setRequestLocale`); production requests are served from the CDN
  without running React.
- **RTL support** — a single `dir` attribute on `<html>` mirrors the entire UI because every
  layout utility is a CSS logical property. The E2E suite asserts the mirrored geometry, not
  just the attribute.
- **ICU message catalogs** — pluralization, interpolation, and named formats per locale, with
  catalog parity enforced by tests (key sets, ICU syntax, and plural-category coverage).
- **Locale-aware formatting** — dates, numbers, currency, percent, and relative time rendered
  through next-intl formatters with an explicit time zone (no hydration mismatches).
- **Multilingual SEO** — canonical URLs, full hreflang alternate sets with `x-default`,
  a sitemap with `xhtml:link` alternates, and a robots policy — all derived from one module.
- **Test matrix** — 45 Vitest unit/component tests plus 21 Playwright E2E tests against a
  production build, wired into GitHub Actions.

## Quickstart

```bash
npm ci          # install exact dependency versions
npm run dev     # http://localhost:3000 redirects to /en
```

Requires Node.js 20 or newer (CI uses 24).

## Scripts

| Script                     | Purpose                                                  |
| -------------------------- | -------------------------------------------------------- |
| `npm run dev`              | Development server                                       |
| `npm run build`            | Production build (static generation of all locales)      |
| `npm run start`            | Serve the production build                               |
| `npm run lint`             | ESLint                                                   |
| `npm run typecheck`        | TypeScript, no emit                                      |
| `npm test`                 | Unit + component tests (Vitest)                          |
| `npm run test:coverage`    | Unit tests with V8 coverage                              |
| `npm run test:e2e`         | Build, then Playwright E2E (Chromium)                    |
| `npm run markdownlint`     | Markdown lint                                            |
| `npm run format`           | Prettier write                                           |
| `npm run verify`           | Lint + typecheck + unit tests + build, in one command    |

## Project structure

```text
src/
  app/
    [locale]/          # Every user-visible route (layout owns <html lang dir>)
    sitemap.ts         # Multilingual sitemap with hreflang alternates
    robots.ts          # Crawl policy
  components/          # One folder per component: implementation, index, README
  i18n/
    config.ts          # Locale SSOT: codes, direction, labels, type guards
    routing.ts         # next-intl routing contract (prefix, detection, cookie)
    navigation.ts      # Locale-aware Link / useRouter / redirect / getPathname
    request.ts         # Per-request config: messages, formats, time zone
  lib/seo.ts           # Canonical / hreflang / absolute URL builders
  proxy.ts             # Edge locale detection and URL normalization
messages/              # One JSON catalog per locale (en.json is the schema)
e2e/                   # Playwright specs (routing, RTL, switcher, SEO, formatting)
content/               # Content-marketing kit (see content/README.md)
docs/                  # Architecture, guides, trade-offs, line-by-line explainers
```

## Documentation

| Document                                             | Contents                                            |
| ---------------------------------------------------- | --------------------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md)       | Request lifecycle, rendering strategy, data flow    |
| [`docs/i18n-guide.md`](docs/i18n-guide.md)           | Adding locales/messages, ICU rules, RTL, pitfalls   |
| [`docs/testing.md`](docs/testing.md)                 | Test pyramid, what is covered where, how to extend  |
| [`docs/trade-offs.md`](docs/trade-offs.md)           | Decisions taken and the alternatives that lost      |
| [`docs/explainers/`](docs/explainers/)               | Line-by-line walkthroughs of the core modules       |

## License

[MIT](LICENSE)
