# Instagram

A 10-slide carousel (the format that performs for technical content), a Reel caption, and
hashtag sets. Slides are text-over-screenshot; keep each slide to one idea.

## Carousel: slides and copy

Design: 1080×1350 (4:5). Dark background (`#0f172a`), white text, one screenshot per slide
where indicated. Slide 1 is the hook — it must work with zero context.

| #  | On-slide text                                                                   | Visual                                      |
| -- | ------------------------------------------------------------------------------- | ------------------------------------------- |
| 1  | Most i18n tutorials stop at "put your strings in a JSON file." That's the easy 10%. | None — pure hook                            |
| 2  | I built the hard 90%: 6 languages, one Next.js codebase.                        | `shot-en.png`                               |
| 3  | English → Hindi → Arabic. One layout. Zero per-language CSS.                    | `shot-en.png` + `shot-hi.png` + `shot-ar.png` stacked |
| 4  | RTL is not a translation task. It's a CSS decision made on day one.             | `shot-ar.png` full-bleed                     |
| 5  | If your CSS says `padding-left`, Arabic breaks. Logical properties (`ps-*`, `me-*`) fix it. | Code snippet screenshot                      |
| 6  | Arabic has SIX plural forms. English has two. String concatenation cannot survive this. | Plural code snippet                          |
| 7  | The test that matters: does the layout actually mirror? Assert geometry, not the `dir` attribute. | Header bounding-box comparison             |
| 8  | 45 unit tests + 21 end-to-end tests. Expected values computed with `Intl` — never hardcoded. | Terminal screenshot of a green test run      |
| 9  | Strongest test in the suite: pages render with JavaScript DISABLED. Truly server-rendered. | Terminal + page side by side                 |
| 10 | Full code + architecture docs. Link in bio.                                     | `shot-demo-ar.png` (formatting demo in Arabic) |

## Caption (carousel)

***

Most i18n tutorials stop at "put your strings in a JSON file." That's the easy 10%.

The hard 90% is what happens when your first Arabic user arrives: right-to-left layout,
six-form plural rules, date and number formatting, and SEO that search engines actually
trust.

I built a reference implementation in Next.js that handles all of it — six languages
(English, Hindi, Malayalam, Tamil, Kannada, Arabic), every page statically generated, and a
test suite that proves the hard parts:

- RTL asserted by geometry (the UI must actually mirror, not just declare `dir="rtl"`)
- Arabic plural categories checked against CLDR via `Intl.PluralRules`
- Pages rendered with JavaScript disabled to prove they're truly server-rendered
- Canonical URLs, hreflang, and sitemap from one module — they can never disagree

Swipe through for the architecture decisions that made it work.

Code + line-by-line docs: link in bio.

***

```text
# nextjs #i18n #webdevelopment #typescript #frontend #javascript #programming #webdev
# coding #softwareengineering #react #developers #techtok #learntocode #rtl
```

## Reel caption (pairs with `reels.md` script 1)

***

POV: your first Arabic user opens the app and the layout is mirrored — because you used
logical CSS properties, not `padding-left`.

Six languages. One codebase. Zero per-language stylesheets.

Full reference implementation: link in bio.

***

```text
# webdevelopment #nextjs #i18n #coding #programming #frontend #developers #javascript
# softwareengineering #arabic #rtl #techtok
```

## Posting notes

- Carousel: post Tuesday–Thursday, 11:00–13:00 local. Reels: 19:00–21:00.
- Alt text for every slide (accessibility + reach): e.g. slide 4 → *"Arabic home page of the
  demo, right-aligned layout with the language switcher on the left."*
- First comment: *"Which locale has broken your layout before? Mine: Arabic, until I switched
  to logical properties."* — comment bait that is genuinely on-topic.
- Keep the link out of the caption (Instagram suppresses link posts); use "link in bio" and a
  pinned story with the tap-through.
