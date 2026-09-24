# Short-form video scripts (Reels / Shorts / TikTok)

Three scripts, 30–45 seconds each, all vertical (1080×1920). Each is designed to work muted
with burned-in captions and to be shootable from a screen recording plus one talking-head
segment.

## Script 1 — "The mirror moment" (35 s)

**Hook (0:00–0:03):** Screen shows the English home page.
**Caption:** *"Watch what happens when I switch this page to Arabic."*

| Time      | Shot                                                                 | Caption                                              |
| --------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| 0:03–0:08 | Switcher opens, selects العربية; the layout mirrors in real time      | "Same components. Same route. Everything flips."     |
| 0:08–0:13 | Slow pan across the mirrored header: nav on the right, switcher on the left | "No per-language CSS. One `dir` attribute."    |
| 0:13–0:19 | Scroll to the formatting demo; counter decrements to 2               | "Arabic has six plural forms. English has two."      |
| 0:19–0:25 | Terminal: `npm test` → "45 passed", `npm run test:e2e` → "21 passed" | "And 66 tests prove it, including the mirror."       |
| 0:25–0:35 | GitHub repo, README hero, link overlay                               | "Full code + architecture docs — link in bio."       |

**Caption text for the post:**

***

Arabic flips the entire layout with ONE attribute — because the CSS uses logical properties
(`ps-*`, `me-*`), not `padding-left`.

The E2E test asserts the header actually mirrors. A test that only checks `dir="rtl"` passes
on a broken layout.

6 languages, 1 codebase, 66 tests. Link in bio.

```text
# nextjs #i18n #webdev #coding #frontend
```

***

## Script 2 — "Why your i18n will break" (40 s)

**Hook (0:00–0:04):** Talking head or text-on-screen.
**Caption:** *"Three i18n bugs that will hit you in production — and the fixes."*

| Time      | Shot                                                                 | Caption                                                       |
| --------- | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| 0:04–0:14 | Bug 1: code showing `count === 1 ? "item" : "items"`                 | "Bug 1: English-shaped plurals. Arabic has six categories."   |
| 0:14–0:20 | Fix: ICU message with `zero/one/two/few/many/other`                  | "Fix: ICU messages + a test against Intl.PluralRules."        |
| 0:20–0:30 | Bug 2: date rendered on server (UTC) vs client (local) → mismatch    | "Bug 2: hydration mismatch — server formats in UTC."          |
| 0:30–0:36 | Fix: one `timeZone` constant shared by both sides                    | "Fix: one explicit time zone for server AND client."          |
| 0:36–0:40 | Repo link overlay                                                    | "Both fixes, plus 64 more tests: link in bio."                |

**Caption text for the post:**

***

The three i18n bugs I see most in production:

1. `count === 1` plural logic — Arabic has six plural categories, not two
2. Hydration mismatches from server-side dates — the server formats in UTC, the browser in
   the visitor's zone
3. RTL declared but broken — physical CSS properties (`padding-left`) ignore direction

All three have structural fixes, not patches. Full reference implementation in bio.

```text
# webdevelopment #i18n #nextjs #programming #coding
```

***

## Script 3 — "Test suite tour" (45 s)

**Hook (0:00–0:04):** Terminal, cursor blinking.
**Caption:** *"What 66 tests look like for a multilingual site."*

| Time | Shot | Caption |
| --------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 0:04–0:12 | `npm test` runs; file list scrolls (config, messages, seo, components) | "45 unit tests: catalog parity, ICU validity, plural coverage." |
| 0:12–0:20 | Highlight `messages.test.ts` output line about plural categories | "This test asks Intl.PluralRules which forms Arabic uses." |
| 0:20–0:30 | `npm run test:e2e` runs; specs scroll (routing, rtl, seo, formatting) | "21 E2E tests against a production build — real redirects, real cookies." |
| 0:30–0:38 | The no-JS test name scrolls past; cut to the page rendering without JS | "This one renders pages with JavaScript disabled." |
| 0:38–0:45 | Repo + docs tree on GitHub | "All public. Line-by-line docs in docs/. Link in bio." |

**Caption text for the post:**

***

What does testing a multilingual site actually look like?

45 unit tests: every catalog checked for key parity, valid ICU, and — the interesting one —
that each plural message covers every category the locale uses (Arabic: six).

21 E2E tests against a production build: redirects, Accept-Language detection, cookie
persistence, RTL geometry, SEO output.

And one test renders pages with JavaScript disabled, because "it works in my browser" is not
a rendering strategy.

Link in bio.

```text
# testing #nextjs #i18n #playwright #vitest
```

***

## Production notes

- Record the browser at a phone-width viewport (~390×844 CSS px) scaled to 1080×1920; desktop
  layouts are unreadable on phones.
- Burn captions at ~64 px with a solid backing rectangle; keep them in the middle third to
  clear platform UI.
- Scripts 1 and 3 need only a screen recorder; script 2 works best with a talking head for the
  hook, then screen capture.
- Keep each cut under 5 seconds — these scripts have 7–8 cuts each for a reason.
- Export at 1080×1920, H.264, 8–10 Mbps; platforms re-encode aggressively.
