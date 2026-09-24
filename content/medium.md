# Medium adaptation

Platform notes for publishing the canonical article on Medium.

## Metadata

- **Title:** One codebase, six languages, zero layout forks: multilingual Next.js done properly
- **Subtitle:** Locale-prefixed routing, RTL without forking, Arabic's six-form plurals, and
  a test suite that proves all of it
- **Tags (max 5):** `nextjs`, `i18n`, `internationalization`, `web-development`, `typescript`
- **Canonical link:** set Medium's "Import a story" flow (or
  Settings → Publishing → Import) with your blog URL so the canonical tag points at the
  original. If publishing directly, add at the top: `Originally published at <blog-url>`.

## Publication checklist

1. Import via **medium.com/p/import** using the blog URL — Medium keeps formatting and sets
   the canonical automatically.
2. Add the subtitle in the post's subtitle field (not as body text).
3. Verify the five tags are set exactly as above.
4. Replace the repository URL if it changed (find-and-replace
   `https://github.com/baneeishaque-ompventure/nextjs-i18n-demo`).
5. Insert the screenshots at the marked points below before publishing.
6. Publish, then paste the Medium URL back into the blog post as a "Also on Medium" line.

## Body

Use `blog-post.md` verbatim, with these Medium-specific adjustments:

- **Hero image** after the title (Medium shows a full-width lead image): use
  `shot-en.png` — the English home page hero.
- **Screenshot break 1** after "RTL is a layout decision" — insert `shot-ar.png` (Arabic home
  page) and `shot-hi.png` (Hindi home page) side by side as two inline images with the
  caption: *"The same components: English, Hindi, and Arabic — one layout, three directions."*
- **Screenshot break 2** after the pluralization section — insert `shot-demo-ar.png` (the
  formatting demo in Arabic) with the caption: *"Live counter in Arabic: Eastern Arabic
  numerals, six-form plural rules, one message catalog."*
- **Code blocks**: Medium renders fenced blocks as preformatted text; the ICU JSON samples
  survive intact. The `<html lang dir>` snippet may lose syntax colors — acceptable.
- **Bold repository links** render as plain links on Medium; keep them on their own line so
  they read as call-to-action rows.

## Cross-promotion

- Add a footer line: *"This article is part of a full content kit — the repository's
  `content/` directory contains the LinkedIn, X, and short-form versions."*
- Do not enable the Medium paywall for this piece; the goal is reach.
- After 48 hours, check the Medium stats and note the traffic split vs the canonical — if
  Medium outperforms by more than 3x, consider making it the canonical instead and point the
  blog at it.
