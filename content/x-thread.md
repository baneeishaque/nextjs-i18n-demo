# X / Twitter thread

12 posts. Post 1 is the hook; every post stands alone if quoted. Attach `shot-ar.png` to post
2 and a `shot-en.png` / `shot-ar.png` pair to post 7.

***

**1/**
Most i18n tutorials stop at "put your strings in a JSON file."

That's the easy 10%.

I built a reference Next.js app that handles the hard 90% — 6 languages, real RTL, Arabic's
six plural forms — and tested all of it.

Thread:

**2/**
Six languages, one codebase:

English, Hindi, Malayalam, Tamil, Kannada, and Arabic.

Every page statically generated per locale. No React at request time. Served from the CDN.

**3/**
URL strategy: every page lives under a locale prefix.

/en/about, /hi/about, /ar/about.

No "English at the bare path" special case. One URL per language means canonical URLs,
caching, and hreflang all stay honest.

**4/**
Detection happens at the edge, before the first paint:

cookie → Accept-Language → default.

An explicit choice always outranks a guess. The E2E suite proves a browser sending
`Accept-Language: hi-IN` lands on /hi.

**5/**
The RTL part everyone gets wrong:

If your CSS uses `padding-left`, Arabic breaks no matter how good the translation is.

Logical properties (`ps-*`, `me-*`, `start-*`) + one `dir` attribute = the whole UI mirrors.

**6/**
And how do you *prove* RTL works?

Not by asserting `dir="rtl"` — that test passes on a broken layout.

You assert geometry: the nav and the language switcher must swap sides between /en and /ar.

That's in the E2E suite.

**7/**
Arabic has six plural categories: zero, one, two, few, many, other.

English has two.

So the test suite asks `Intl.PluralRules` which categories each locale uses and fails if the
message doesn't cover them all.

Translators can't ship an English-shaped Arabic message.

**8/**
Hydration trap nobody warns you about:

Server renders a date in UTC, browser hydrates it in the visitor's time zone → mismatch.

Fix: one explicit `timeZone` shared by both sides. One line, entire class of bugs gone.

**9/**
Multilingual SEO in one module:

canonical URL + hreflang alternates + sitemap — all computed from the same function.

The classic bug (sitemap and page tags disagree) becomes structurally impossible.

Adding a language grows every alternate set automatically.

**10/**
Testing split:

45 unit tests (Vitest): catalogs, ICU validity, plural coverage, URL builders.

21 E2E tests (Playwright, production build): redirects, detection, cookies, RTL geometry,
SEO output.

Expected values are computed with `Intl`, never hardcoded.

**11/**
The test I'm weirdly proud of: the suite renders pages with **JavaScript disabled**.

Content and formatting must still be there.

It's the strongest proof the site is genuinely server-rendered — and it catches a whole
class of "works on my machine" regressions.

**12/**
Everything is public, including the reasoning and the trade-offs:

- docs/architecture.md — how a request becomes a localized page
- docs/explainers/ — line-by-line walkthroughs
- content/ — the kit that produced this thread

Code: <https://github.com/baneeishaque-ompventure/nextjs-i18n-demo?utm_source=x&utm_medium=social&utm_campaign=nextjs-i18n-launch>

If you find a locale where the plural rules surprise you, open an issue.

## Posting notes

- Post the whole thread in one sitting; reply-to-self chaining only for the first 2 posts
  (later posts get more reach as standalone posts if the thread is quote-tweetable).
- Pin post 1 for a week.
- Quote-post post 5 with a fresh `shot-ar.png` crop after 48 hours — it is the most
  screenshot-driven post.
