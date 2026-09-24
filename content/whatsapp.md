# WhatsApp

Two formats: a community broadcast message and a Status update. WhatsApp is a relationship
channel — send this last, after the polished artifacts exist, and keep it personal.

## Community broadcast (for a developer community or team group)

### Multilingual Next.js — full reference implementation, free to steal from

I put together a production-shaped demo of i18n in Next.js 16 that covers the parts most
tutorials skip:

- 6 languages: English, Hindi, Malayalam, Tamil, Kannada, Arabic (RTL)
- Real right-to-left support — the UI mirrors with one attribute, no per-language CSS
- Arabic's six-form plural rules, tested against CLDR data
- Multilingual SEO: canonical, hreflang, sitemap — one source of truth
- 45 unit + 21 E2E tests, all green in CI

Code + docs (every design decision is written down):
<https://github.com/baneeishaque-ompventure/nextjs-i18n-demo?utm_source=whatsapp&utm_medium=social&utm_campaign=nextjs-i18n-launch>

Worth a look if you're adding i18n soon — or if you've ever had an Arabic user tell you the
layout is broken.

***

## Status update (short, with a screenshot)

***

Six languages. One Next.js codebase. Zero per-language CSS.

Arabic flips the whole UI with one `dir` attribute — logical CSS properties do the rest.

45 unit + 21 E2E tests prove it, including an RTL test that asserts the layout actually
mirrors.

Reference implementation: <https://github.com/baneeishaque-ompventure/nextjs-i18n-demo>

***

## Posting notes

- Broadcast only in groups where you have posting rights; otherwise send as a personal
  message to 3–5 relevant contacts — that outperforms a broadcast.
- For Status: use `shot-ar.png` (Arabic home page) — the unfamiliar script stops the scroll,
  and the caption explains it in one line.
- Status text truncates after ~700 characters; the short version fits with room to spare.
- Do not forward the same text to multiple groups in one hour; WhatsApp flags it as spam
  behavior.
