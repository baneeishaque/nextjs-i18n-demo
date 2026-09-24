# Explainer: the i18n core

A walkthrough of the four modules in `src/i18n/` — what each line group does, and why it is
written that way. Read [`../architecture.md`](../architecture.md) first for the request
lifecycle this code plugs into.

## `config.ts` — the locale single source of truth

```ts
export const LOCALES = ["en", "hi", "ml", "ta", "kn", "ar"] as const;   // :28
export type Locale = (typeof LOCALES)[number];                          // :36
export const DEFAULT_LOCALE: Locale = "en";                             // :42
export const RTL_LOCALES = ["ar"] as const satisfies readonly Locale[]; // :49
```

- **`as const` on `LOCALES`** narrows the array to a tuple of string literals. Without it
  the type would be `string[]`, `Locale` would collapse to `string`, and every downstream
  `Record<Locale, ...>` would stop enforcing completeness.
- **`Locale` is derived, never declared.** Adding `"bn"` to the array is the *only* way to
  add a locale; the compiler then demands the label maps and any exhaustive switch grow
  with it. A hand-written union would allow the array and the type to drift.
- **`satisfies readonly Locale[]` on `RTL_LOCALES`** checks every member against `Locale`
  while preserving the literal tuple type — a typo like `"ur"` fails at compile time, and
  `"ar"` stays available as a literal for narrowing.
- **`DEFAULT_LOCALE: Locale`** is annotated, not inferred, so the constant can never hold a
  value outside the union even if `LOCALES` changes order.

```ts
export function isLocale(value: unknown): value is Locale {                       // :61
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
```

- The parameter is `unknown`, not `string`: the function is used at trust boundaries
  (URL segments, cookies, headers) where the value genuinely could be anything, and
  `unknown` forces callers to route it through the guard instead of casting.
- The predicate return type `value is Locale` is what makes the function *useful*: after
  `if (!isLocale(locale)) return;`, TypeScript treats `locale` as the union everywhere
  below — no non-null assertions, no casts.
- `(LOCALES as readonly string[])` widens the tuple once for `.includes()`; the public API
  stays narrow.

```ts
export function isRtlLocale(locale: Locale): boolean {   // :71
export function getDirection(locale: Locale): "ltr" | "rtl" { return isRtlLocale(locale) ? "rtl" : "ltr"; } // :85
```

- Direction is computed from data, not duplicated: `RTL_LOCALES` is the fact,
  `isRtlLocale` is the query, `getDirection` is the presentation adapter for the HTML
  `dir` attribute. Adding a second RTL locale touches exactly one array.
- The return type is the literal union `"ltr" | "rtl"`, not `string`, so `<html dir={...}>`
  cannot be handed a value the DOM would ignore.

```ts
const LOCALE_LABELS: Record<Locale, string> = { en: "English", hi: "हिन्दी", ml: "മലയാളം", ... }; // :94
const LOCALE_ENGLISH_NAMES: Record<Locale, string> = { en: "English", hi: "Hindi", ... };         // :108
```

- Two label maps exist because they serve different audiences: the native label
  (`മലയാളം`) is for humans choosing their language; the English name is for
  machine-readable surfaces (structured data, logs, alternate-link titles) where a
  language-neutral identifier is expected.
- `Record<Locale, string>` makes both maps *exhaustive by type*: adding a locale to
  `LOCALES` fails the build here until both names are supplied.

The module deliberately imports nothing — no React, no next-intl, no Node APIs — which is
why the same file runs in the Edge proxy, Server Components, the browser bundle, and
Vitest unchanged.

## `routing.ts` — the shared routing contract

```ts
export const routing = defineRouting({      // :33
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
  localeDetection: true,
  localeCookie: { maxAge: 60 * 60 * 24 * 365, sameSite: "lax" },
});
```

One `defineRouting` call is consumed by three different worlds:

| Consumer                        | What it reads the routing object for                     |
| ------------------------------- | -------------------------------------------------------- |
| `src/proxy.ts`                  | Locale detection, redirect targets, cookie settings       |
| `src/i18n/navigation.ts`        | Prefixing `Link`/`useRouter` targets with the active locale |
| `src/i18n/request.ts`           | Which locale set is valid for `hasLocale`                 |

- `localePrefix: "always"` keeps a strict 1:1 mapping between URL and rendered language
  (`/hi/about` is the only address of the Hindi about page). `as-needed` would serve the
  default locale at bare paths, splitting each English page across two URLs — see
  [`../trade-offs.md`](../trade-offs.md).
- `localeDetection: true` routes first-time visitors by `Accept-Language` instead of always
  landing on English.
- `localeCookie` is explicit rather than defaulted so the security posture is reviewable:
  a year-long, `SameSite=Lax` preference cookie — no cross-site transmission, no secrets.
  `Lax` (not `Strict`) is required: a `Strict` cookie would not be sent on the first
  cross-site navigation to the site, which is exactly when detection needs it.

## `navigation.ts` — locale-aware navigation primitives

```ts
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing); // :32
```

- **Why a module instead of calling `createNavigation` at each site:** one instance means
  referential stability (memoized components see the same `Link` identity) and one module
  boundary to mock in unit tests — `LanguageSwitcher.test.tsx` mocks exactly this path.
- **`usePathname()` returns the path *without* the locale prefix.** That is the key
  mechanic of the switcher: it takes the bare pathname, passes it back to
  `router.replace({ pathname, params }, { locale })`, and next-intl rebuilds the URL under
  the new locale. No string surgery on the URL anywhere in the app.
- **`getPathname`** is the server-side URL builder used by metadata and sitemap code paths
  where a `Link` component is not involved.

## `request.ts` — per-request configuration

```ts
export default getRequestConfig(async ({ requestLocale }) => {        // :71
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale, messages: (await import(`../../messages/${locale}.json`)).default, ... };
});
```

- **`requestLocale` is awaited** because Next.js 16 exposes route params asynchronously.
- **`hasLocale` is the trust boundary.** `requestLocale` can be `undefined` (static
  generation of a locale-less route) or arbitrary (hand-crafted URL). Both degrade to the
  default locale here; the layout independently 404s unknown segments, so a bad URL never
  reaches this fallback in practice — this guard protects the *programmatic* paths.
- **The dynamic `import()`** is what keeps bundles honest: a Hindi page ships the Hindi
  catalog, not six catalogs. Webpack turns the template literal into a context module over
  `messages/*.json` and picks the right chunk at build time.

```ts
const DEFAULT_TIME_ZONE = "Asia/Kolkata";   // :27
```

- This constant is the single reason server-rendered dates and client-hydrated dates agree.
  The server would otherwise format in the container's zone (UTC) while the browser uses the
  visitor's zone — the classic React hydration mismatch on any date. Pinning the zone makes
  both sides compute identical strings; the demo uses the community's home zone.

```ts
const formats = { dateTime: { short: {...}, long: {...} }, number: { precise: {...} } } as const; // :36
```

- Named presets turn formatting into a design decision made once. `format.dateTime(date, "long")`
  reads better than an inline options object, and changing "dates always show the weekday"
  is one edit that lands in every locale.

```ts
onError(error) {                                                       // :80
  if (error.code === "MISSING_MESSAGE") { console.error(`[i18n] ${error.message}`); }
  else { throw error; }
},
getMessageFallback({ namespace, key, error }) {                        // :92
  const path = [namespace, key].filter(Boolean).join(".");
  return error.code === "MISSING_MESSAGE" ? `⚠ ${path}` : `⚠ ${path}`;
},
```

- The error policy splits failures into two classes: **missing translations are operational
  gaps** (render a loud `⚠ Namespace.key` marker, log it, keep the page alive) while
  **anything else is a programming error** (bad ICU syntax, wrong argument shape) and
  throws in every environment. A malformed catalog should never reach a user; a missing key
  should never take a page down.
- `messages.test.ts` makes missing keys a CI failure, so the fallback is a safety net for
  production hotfixes, not a workflow.
- `[namespace, key].filter(Boolean)` tolerates messages requested without a namespace,
  where `namespace` is `undefined` and a naive join would produce `"undefined.key"`.

## How the four modules compose

```text
config.ts   (facts: which locales, which direction, which labels)
   │
routing.ts  (policy: prefix, detection, cookie)  ──────►  proxy.ts (Edge)
   │                                                       │
navigation.ts (client/server nav primitives)               │
   │                                                       ▼
request.ts  (messages, time zone, formats, error policy) ─► server render + client provider
```
