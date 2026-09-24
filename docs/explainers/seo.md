# Explainer: multilingual SEO

A walkthrough of the three modules that produce every URL a crawler sees, and the wiring that
connects them to pages.

## The problem being solved

A multilingual site makes three promises to search engines, and a broken site breaks exactly
one of them invisibly:

1. **Canonical** — "this page, in this language, has exactly one authoritative URL."
2. **hreflang** — "here is every language variant of this page, and here is the fallback."
3. **Sitemap** — "here is every indexable URL, with its alternates, without rendering."

The failure mode is silent because the pages *look* right in every language. The bug only
appears weeks later, when a search engine picks the wrong language for a query — or when the
sitemap and the page metadata disagree and the crawler believes whichever it read last.
The cure is structural: one module computes all three, and every consumer calls it.

## `src/lib/seo.ts` — one source of URL truth

```ts
export const SITE_URL: string = normalizeSiteUrl(            // :29
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nextjs-i18n-demo.example.com",
);
```

- **Why an env var with a fallback:** hreflang values must be absolute URLs, so the origin
  must be known at build time. `NEXT_PUBLIC_SITE_URL` is inlined by Next.js at build time;
  the documented fallback keeps local builds, preview deploys, and the test suite
  deterministic without requiring any environment setup.
- **`normalizeSiteUrl` strips trailing slashes** so `absoluteUrl` can concatenate without
  producing `https://example.com//about` — a URL that technically works and quietly
  duplicates every canonical.

```ts
export function normalizePathname(pathname: string): string {   // :53
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}
```

- Guards the two realistic caller mistakes: `"about"` (missing slash) and the already-correct
  `"/about"`. Trailing slashes are excluded by contract — canonical URLs for this site never
  end in `/`, because `/about` and `/about/` would be two URLs for one page.

```ts
export function localizedPath(locale: Locale, pathname: string): string {   // :78
  const normalized = normalizePathname(pathname);
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}
```

- **The root is special-cased**: `/` becomes `/hi`, not `/hi/`. The trailing slash is
  redundant and creates duplicate-URL ambiguity for crawlers. This one line is why the
  sitemap emits `/en` and `/en/about` with consistent shapes.

```ts
export function buildLanguageAlternates(pathname: string): Record<string, string> {   // :93
  const alternates: Record<string, string> = {};
  for (const locale of LOCALES) {
    alternates[locale] = absoluteUrl(localizedPath(locale, pathname));
  }
  alternates["x-default"] = absoluteUrl(localizedPath(DEFAULT_LOCALE, pathname));
  return alternates;
}
```

- **It iterates `LOCALES`** — adding a language automatically grows every hreflang set on
  every page and in the sitemap. No per-page list to forget.
- **`x-default` points at the default locale**, which tells crawlers which language to serve
  when no language matches the visitor. Omitting `x-default` is the most common hreflang
  mistake: it leaves the no-match case undefined.
- The function returns a plain `Record<string, string>` because that is exactly the shape
  Next.js `Metadata.alternates.languages` expects — no adapter layer.

```ts
export function canonicalUrl(locale: Locale, pathname: string): string {   // :109
  return absoluteUrl(localizedPath(locale, pathname));
}
```

- Deliberately a named function rather than an inline template at each call site: it gives
  the concept a name, one place to change the policy (e.g. adding a query-free variant), and
  a single target for the unit tests in `seo.test.ts`.

## Wiring: pages emit canonical + alternates

Every page's `generateMetadata` calls the same two builders:

```ts
// src/app/[locale]/about/page.tsx
alternates: {
  canonical: canonicalUrl(locale, "/about"),
  languages: buildLanguageAlternates("/about"),
}
```

The only per-page input is the **locale-independent route path** (`"/about"`). The locale
comes from the route segment, and everything else is derived. A page cannot invent its own
URL policy because it never constructs URLs.

The layout supplies the two document-level pieces:

```ts
// src/app/[locale]/layout.tsx
metadataBase: new URL(SITE_URL),                 // resolves relative metadata URLs
title: { default: t("siteName"), template: `%s | ${t("siteName")}` },
description: t("siteDescription"),
```

- `metadataBase` is what makes Next.js resolve any relative canonical/alternate emitted by
  child pages against the production origin.
- The title template appends the localized site name to every page title — a per-locale
  branding rule applied once.

`e2e/seo.spec.ts` asserts the emitted HTML: canonical per page, exactly
`LOCALES.length + 1` alternate links (six locales plus `x-default`), and localized titles.

## `src/app/sitemap.ts` — the multilingual sitemap

```ts
const INDEXABLE_ROUTES = ["/", "/about"] as const;       // :25
export default function sitemap(): MetadataRoute.Sitemap {   // :33
  const lastModified = new Date();
  return INDEXABLE_ROUTES.flatMap((route) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(localizedPath(locale, route)),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: route === "/" ? 1 : 0.8,
      alternates: { languages: buildLanguageAlternates(route) },
    })),
  );
}
```

- **Explicit route list over filesystem walking.** A walk would eventually include a route
  that must not be indexed (a thank-you page, a draft). The explicit tuple is a deliberate
  gate: adding an indexable route is a visible edit, and `e2e/seo.spec.ts` pins the expected
  entry count (`LOCALES.length × 2`), so a forgotten addition fails CI.
- **`flatMap` over nested loops** produces the flat entry list Next.js expects while keeping
  the route × locale structure visible in the source.
- **One `lastModified` for all entries** — freshness here is a build-level property, not a
  per-page one, and a single timestamp avoids implying false per-page recency.
- **Every entry carries the full alternate set.** That is the Google-recommended shape for
  multilingual sites: a crawler that reads only the sitemap still discovers every language
  variant, without rendering a single page.
- `priority: route === "/" ? 1 : 0.8` encodes the site's own opinion of relative importance —
  the only ranking signal a sitemap legitimately carries.

## `src/app/robots.ts` — the crawl policy

```ts
export default function robots(): MetadataRoute.Robots {     // :17
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: absoluteUrl("/sitemap.xml") };
}
```

- Deliberately permissive (this is a public showcase), but the `sitemap` line is the
  load-bearing part: it points crawlers at the multilingual sitemap, which is how they
  discover all six language variants from one fetch.
- `absoluteUrl` is reused rather than string-concatenated, so the robots file cannot drift
  from the sitemap's origin.

## Why this structure prevents the classic bugs

| Classic multilingual SEO bug                                    | Structural prevention here                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Sitemap and page metadata list different hreflang sets          | Both call `buildLanguageAlternates`; there is no second list to drift     |
| Adding a locale silently misses some pages                       | Every loop iterates `LOCALES`; the sitemap count is asserted in E2E      |
| `x-default` forgotten                                            | It is emitted inside the shared builder, not at call sites                |
| Trailing-slash variants indexed as duplicates                    | `localizedPath` special-cases root; `normalizePathname` fixes input       |
| Relative URLs in hreflang (invalid — must be absolute)           | `absoluteUrl` is the only way URLs are built; `SITE_URL` has a fallback   |
| Non-indexable routes leak into the sitemap                       | Explicit `INDEXABLE_ROUTES` tuple + entry-count assertion                 |

## Verification

```bash
npx vitest run src/lib/seo.test.ts   # URL builders in isolation
npm run test:e2e -- seo              # emitted HTML, sitemap XML, robots.txt
curl -s localhost:3100/sitemap.xml | head   # eyeball the real output
```
