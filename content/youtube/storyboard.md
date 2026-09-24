# Storyboard

Generated from [`scenes.json`](scenes.json) by `build-video.py --docs`.
Timings are the English narration timeline; other locales shift slightly.

| # | Time | Slide title (en) | On-screen code | Narration (en) |
| - | ---- | ---------------- | -------------- | -------------- |
| 1 | 0.4–12.0s | One codebase. Six languages. | `next.js 16 · next-intl · typescript · tailwind v4` | Every web product eventually needs more than one language. This is a Next.js demo that speaks six: English, Hindi, Malayalam, Tamil, Kannada, and Arabic. And it proves every claim with tests. |
| 2 | 13.8–25.5s | One URL per language | `/en/about    /hi/about    /ar/about` | Every page lives under a locale prefix, so each language has exactly one URL. The edge detects the visitor's language from a cookie or the Accept-Language header, and every page is generated as static HTML. |
| 3 | 27.3–38.1s | RTL without forking | `<html lang="ar" dir="rtl">` | Arabic flips the entire document with one direction attribute. Because the layout uses logical CSS properties, there is no per-language stylesheet. And the end-to-end tests assert that the layout really mirrors. |
| 4 | 39.9–49.7s | Six plural forms | `{count, plural, one {# item} other {# items}}` | English has two plural forms. Arabic has six. The catalogs use ICU messages, and a test asks the platform which categories each language uses, so a wrong plural cannot ship. |
| 5 | 51.5–62.9s | Formatting follows the locale | `1,23,456.89    →    ١٬٢٣٤٬٥٦٧٫٨٩` | Dates, numbers, currencies, and percentages follow the locale. Server and browser share one explicit time zone, so there are no hydration mismatches. Arabic even gets Eastern Arabic numerals. |
| 6 | 64.7–74.1s | SEO search engines trust | `<link rel="alternate" hreflang="hi" href="…/hi/about">` | Search engines need canonical URLs, hreflang alternates, and a sitemap. All three are computed by one module, so the page and the sitemap can never disagree. |
| 7 | 75.9–85.4s | 66 tests prove it | `45 unit · 21 e2e · 0 failing` | Forty-five unit tests and twenty-one end-to-end tests run against a production build. One of them renders every page with JavaScript disabled, to prove the content is truly server-rendered. |
| 8 | 87.2–94.8s | Steal the checklist | `github.com/baneeishaque-ompventure/nextjs-i18n-demo` | The code, the architecture docs, and the line-by-line explainers are all public, under the MIT license. Link in the description. |
