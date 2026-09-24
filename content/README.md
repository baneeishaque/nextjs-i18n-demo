# Content kit

Everything needed to present this project: one canonical long-form article, platform-specific
adaptations, and a multilingual video pipeline.

## Asset map

| File                              | Platform                    | Format                                | Length        |
| --------------------------------- | --------------------------- | ------------------------------------- | ------------- |
| [`blog-post.md`](blog-post.md)    | Own blog / dev.to / Hashnode | Canonical article (source of truth)   | ~1,800 words  |
| [`medium.md`](medium.md)          | Medium                      | Adapted article + metadata            | ~1,500 words  |
| [`linkedin.md`](linkedin.md)      | LinkedIn                    | Two posts: announcement + deep dive   | 130–220 words |
| [`x-thread.md`](x-thread.md)      | X / Twitter                 | 12-post thread                        | 280 chars/post |
| [`facebook.md`](facebook.md)      | Facebook                    | Group/Page post                       | ~180 words    |
| [`whatsapp.md`](whatsapp.md)      | WhatsApp                    | Community broadcast + Status          | 60–120 words  |
| [`instagram.md`](instagram.md)    | Instagram                   | 10-slide carousel + Reel caption      | Slides + caption |
| [`snapchat.md`](snapchat.md)      | Snapchat                    | Spotlight script                      | 35 seconds    |
| [`reels.md`](reels.md)            | Reels / Shorts / TikTok     | Three short-form scripts              | 30–45 s each  |
| [`youtube/`](youtube/)            | YouTube                     | Full video pipeline (6 languages)     | ~3 minutes    |

## Publishing order

1. **Publish the repository first** — every post links to it.
2. **Blog post** on the canonical domain (or dev.to/Hashnode), then syndicate to Medium with a
   `rel=canonical` pointing at the original.
3. **LinkedIn announcement** the same day; the deep-dive post 2–3 days later.
4. **X thread** the next morning; quote-post the best visual.
5. **Instagram carousel + Reels** midweek; Snapchat Spotlight the same day as Reels.
6. **Facebook** and **WhatsApp** last — they reach people who already know you; give them the
   polished artifact, not the announcement.
7. **YouTube video** whenever the multilingual cut is ready; it is the only asset that shows
   all six languages in one artifact.

## Conventions

- **Repo URL** used throughout: `https://github.com/baneeishaque-ompventure/nextjs-i18n-demo`.
  If the published URL differs, find-and-replace before posting.
- **UTM tags**: append `?utm_source=<platform>&utm_medium=social&utm_campaign=nextjs-i18n-launch`
  to links (the blog post uses `utm_source=blog&utm_medium=referral`).
- **Numbers** quoted in the kit (6 locales, 45 unit tests, 21 E2E tests) are verified by
  `npm test` and `npm run test:e2e`; re-check before posting if the suite changes.
- **Screenshots** for carousel/X posts: capture `/en`, `/hi`, `/ar` (home + the formatting
  demo), plus the dark-mode-free build output. Suggested filenames: `shot-en.png`,
  `shot-hi.png`, `shot-ar.png`, `shot-demo-ar.png`.

## Video pipeline (YouTube)

`youtube/` contains a scripted pipeline rather than a finished upload:

- `scenes.json` — single source of truth: per-scene narration, on-screen text, and titles in
  all six languages.
- `render-slides.mjs` — renders slide images with headless Chromium (correct shaping for
  Devanagari, Malayalam, Tamil, Kannada, and Arabic).
- `build-video.py` — generates narration with macOS `say`, assembles per-locale videos, muxes
  the master multi-audio MKV, and exports subtitles.
- `subtitles/` — generated SRT/VTT files, committed as deliverables.
- `metadata.md` — titles, descriptions, tags, and chapters per locale.

See [`youtube/README.md`](youtube/README.md) for the full pipeline and the Malayalam
voice gap.
