# LanguageSwitcher

Native `<select>` locale picker that preserves the current route while
changing language.

## Files

| File | Purpose |
| --- | --- |
| `LanguageSwitcher.tsx` | Component implementation (Client Component). |
| `LanguageSwitcher.test.tsx` | Unit tests: rendering, active selection, navigation call. |
| `index.ts` | Public barrel export. |

## Behavior

1. Renders one `<option>` per entry in `LOCALES` (`src/i18n/config.ts`),
   labeled with the language's native name (`हिन्दी`, `العربية`, ...).
2. The active locale (from `useLocale()`) is the selected option.
3. On change, `router.replace({pathname, params}, {locale})` re-renders
   the same route under the new locale. The next-intl router also writes
   the `NEXT_LOCALE` cookie, so the choice persists.

## Why a native select

- Keyboard and screen-reader support is built in (`combobox` role,
  arrow-key navigation, type-ahead).
- No custom dropdown code to maintain, test, or get wrong on mobile.
- One `aria-label` (from the message catalog) gives the control an
  accessible name in the active language.

## Testing notes

The unit test mocks `@/i18n/navigation` (router + pathname) and
`next/navigation` (`useParams`) and asserts that selecting a locale calls
`router.replace` with the exact pathname/params/locale triple. End-to-end
coverage lives in `e2e/language-switcher.spec.ts`, which drives a real
browser and asserts the URL and translated content after switching.
