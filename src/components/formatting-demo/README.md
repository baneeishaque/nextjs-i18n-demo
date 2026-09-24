# FormattingDemo

Interactive proof that every locale-sensitive value is rendered through
the active locale's `Intl` rules — never through hand-rolled string math.

## Files

| File | Purpose |
| --- | --- |
| `FormattingDemo.tsx` | Component implementation (Client Component). |
| `FormattingDemo.test.tsx` | Unit tests: formatted outputs and plural interaction. |
| `index.ts` | Public barrel export. |

## What it renders

| Row | Input | Mechanism |
| --- | --- | --- |
| Date | `2026-03-14T10:30:00Z` | `format.dateTime` with `dateStyle: "full"`, `timeStyle: "short"` |
| Number | `1234567.89` | `format.number` (locale grouping: `12,34,567.89` in `en-IN` terms) |
| Currency | `4999.5` INR | `format.number` with `style: "currency"` |
| Percentage | `0.42` | `format.number` with `style: "percent"` |
| Relative time | `2026-03-13T10:30:00Z` vs `2026-03-14T10:30:00Z` | `format.relativeTime` with explicit `now` |
| Plural | cart `count` state | ICU `plural` message with `=0` / `one` / `other` (Arabic: six categories) |

## Determinism rules (why the values are constants)

- **Fixed instants.** `new Date()` at render time would produce different
  output on server and client and trigger React hydration errors.
- **Explicit `now`.** `relativeTime` receives both dates, so "1 day ago"
  is stable forever and in every test environment.
- **Explicit time zone.** The provider inherits `Asia/Kolkata` from
  `src/i18n/request.ts`, so a UTC server and an IST browser agree.

## Testing notes

The unit test wraps the component in `NextIntlClientProvider` with real
message catalogs and computes expected strings with the platform's own
`Intl` APIs (the same contract the component relies on). The E2E suite
(`e2e/formatting.spec.ts`) repeats this in a real browser across locales,
including Arabic numerals and Arabic plural forms.
