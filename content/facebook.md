# Facebook post

For a developer-focused Page or a programming group. One post, link in the body is fine on
Facebook (unlike LinkedIn).

***

Six languages, one Next.js codebase — and a test suite that actually proves the hard parts
work.

I published a reference implementation of multilingual Next.js that goes past the "put your
strings in JSON" stage:

- English, Hindi, Malayalam, Tamil, Kannada, and Arabic (right-to-left)
- Every locale statically generated — pages served from the CDN, no React at request time
- Edge language detection: preference cookie, then Accept-Language, then default
- Arabic's six-form plural rules, enforced by tests against the platform's own CLDR data
- Canonical URLs, hreflang alternates, and a multilingual sitemap from a single module
- 45 unit tests + 21 end-to-end tests, including an RTL layout test that asserts the UI
  actually mirrors (not just that `dir="rtl"` is set)

The part I keep coming back to: the E2E suite renders every page with JavaScript disabled to
prove the content is truly server-rendered. If your i18n breaks without JS, you find out in
CI, not in a bug report.

Stack: Next.js 16 App Router, next-intl, TypeScript, Tailwind v4, Vitest, Playwright.

Code and full architecture docs (the reasoning is written next to the code):
<https://github.com/baneeishaque-ompventure/nextjs-i18n-demo?utm_source=facebook&utm_medium=social&utm_campaign=nextjs-i18n-launch>

Feedback welcome — especially from anyone who has shipped an RTL interface in production.

***

## Posting notes

- Attach the `shot-ar.png` / `shot-en.png` pair as a two-image post; Facebook's grid renders
  the mirrored layout comparison well.
- Post in the 12:00–14:00 window; developer groups are most active around lunch.
- For groups: check self-promotion rules first; if link posts are restricted, put the link in
  the first comment and keep the body as above minus the URL line.
