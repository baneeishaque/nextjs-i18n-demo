# Snapchat Spotlight script

One 35-second vertical script (1080×1920). Spotlight favors raw, fast, subtitle-driven
content — screen recording with large captions outperforms produced edits.

## Concept: "Six languages, one codebase, 35 seconds"

Format: screen recording of the live demo with large burned-in captions. No voiceover needed;
add trending audio at low volume.

| Time      | Visual                                                                 | Caption (burned in)                        |
| --------- | ---------------------------------------------------------------------- | ------------------------------------------ |
| 0:00–0:03 | English home page, hero text visible                                   | "One codebase."                            |
| 0:03–0:07 | Cursor opens the language switcher; the page becomes Hindi             | "Six languages."                           |
| 0:07–0:11 | Switch to Tamil, then Kannada — quick cuts                             | "No page reload. Same route."              |
| 0:11–0:17 | Switch to Arabic — the entire layout visibly mirrors                    | "Arabic flips the WHOLE layout."           |
| 0:17–0:21 | Scroll to the formatting demo in Arabic; counter shows Eastern Arabic numerals | "Arabic numbers. Six plural forms." |
| 0:21–0:26 | Cut to terminal: `npm test` → 45 passed, then `npm run test:e2e` → 21 passed | "45 + 21 tests. All green."          |
| 0:26–0:31 | Cut to `/ar` URL bar and back to the mirrored page                     | "RTL isn't a translation. It's a CSS decision." |
| 0:31–0:35 | Repo page on GitHub, README visible                                    | "Code in the comments."                    |

## Caption for the Snap

***

6 languages. 1 codebase. Arabic flips the entire layout with ONE attribute — because the CSS
uses logical properties, not padding-left.

45 unit + 21 E2E tests prove it.

Full code: github.com/baneeishaque-ompventure/nextjs-i18n-demo

***

## Production notes

- **Subtitles are mandatory** on Spotlight — most viewing is muted. Burn them in at ~64px,
  high contrast, positioned in the lower third but above Snapchat's UI chrome.
- **Screen recording**: 60 fps capture of the browser at 1080×1920 (use a mobile-width
  viewport, ~390×844 CSS px, scaled up) so the text is legible on a phone.
- **The mirror moment is the hook.** If the first three seconds do not show the layout
  flipping, re-cut — that transition is the whole video.
- Record the terminal segment at a font size of at least 20 px; zoom the terminal rather than
  cropping.
- Do not use the trending audio's loud sections over the terminal shots — keep the code
  segment quiet so the green test output reads.
