# LinkedIn posts

Two posts, published 2–3 days apart. The first announces; the second teaches. Plain text —
LinkedIn rewards text posts over link posts, so put the link in the first comment.

## Post 1 — announcement (publish day 1)

> Most i18n advice tells you to "add a translations folder."
>
> That is the easy 10%. The hard 90% is what happens when your first Arabic user arrives.
>
> I built a reference implementation to answer the hard questions up front:
>
> - 6 languages: English, Hindi, Malayalam, Tamil, Kannada, and Arabic
> - RTL that mirrors the whole UI with one HTML attribute — no per-language stylesheets
> - Arabic's six-form plural rules enforced by tests, not hope
> - Multilingual SEO: canonical URLs, hreflang alternates, sitemap — all from one module
> - 45 unit tests + 21 end-to-end tests against a production build
> - Every locale statically generated, so pages are served from the CDN
>
> The part I am most proud of: the test suite asserts RTL *geometry* (the header actually
> mirrors) and renders pages with JavaScript disabled to prove they are truly
> server-rendered.
>
> Stack: Next.js 16 App Router, next-intl, TypeScript, Tailwind v4, Vitest, Playwright.
>
> The repository is public, with the reasoning written next to the code and a full
> architecture guide in docs/.
>
> Link in the comments.
>
> #NextJS #i18n #WebDevelopment #TypeScript #Accessibility

**First comment:** `Code + docs: https://github.com/baneeishaque-ompventure/nextjs-i18n-demo?utm_source=linkedin&utm_medium=social&utm_campaign=nextjs-i18n-launch`

## Post 2 — technical deep dive (day 3–4)

> The bug that convinced me to write a test for RTL layout:
>
> The page declared `dir="rtl"`. The Arabic translation was perfect. And the layout was
> still broken — because the CSS used physical properties. `padding-left` is
> `padding-left` in every language.
>
> The fix is a discipline, not a patch:
>
> 1. Use logical properties everywhere (`ps-*`, `me-*`, `start-*`, `text-start` in Tailwind)
> 2. Apply direction once: `<html lang={locale} dir={getDirection(locale)}>`
> 3. Prove it — assert the header's navigation and language switcher swap sides between
>    the English and Arabic versions
>
> That third step is the one people skip. A test asserting `dir="rtl"` passes on a
> completely broken layout. A test comparing bounding boxes does not.
>
> Same lesson applies to i18n in general: the translation is the visible 10%. The other 90%
> is direction, plural categories (Arabic has six), date/number formatting, hydration-safe
> time zones, and canonical URLs that search engines trust.
>
> I wrote up the whole architecture, including the trade-offs I accepted, in the repo:
>
> #WebDevelopment #NextJS #i18n #FrontendEngineering

**First comment:** `Full case study: https://github.com/baneeishaque-ompventure/nextjs-i18n-demo/blob/main/content/blog-post.md?utm_source=linkedin&utm_medium=social&utm_campaign=nextjs-i18n-launch`

## Posting notes

- Post 1 between 08:00–10:00 on a Tuesday–Thursday; Post 2 the same slot 2–3 days later.
- Attach one image to each: Post 1 → `shot-ar.png`; Post 2 → a side-by-side of `shot-en.png`
  and `shot-ar.png` (the mirrored header is the whole point).
- Do not edit the post in the first hour — edits suppress reach.
- Reply to every comment in the first two hours; that is where the distribution comes from.
