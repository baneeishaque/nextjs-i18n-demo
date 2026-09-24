# Trade-offs

Every engineering choice here was made against at least one credible alternative. This
document records the decision, the alternative, and what would change the verdict.

## Framework and library

### next-intl over i18next / next-i18next / FormatJS / hand-rolled

- **Chosen:** next-intl. First-class App Router support (Server Components, static
  generation, `generateMetadata`), typed messages, and routing primitives (`Link`,
  `useRouter`, `redirect`) that keep the locale attached to navigation.
- **Alternatives:** i18next has the largest ecosystem but its App Router story requires
  glue; next-i18next targets the Pages Router; raw FormatJS means hand-building routing,
  detection, and metadata — the exact bug surface this demo exists to eliminate.
- **Cost accepted:** coupling to one library. Mitigation: all library usage is confined to
  `src/i18n/*` and components call only `useTranslations`/`getTranslations`/`useFormatter`,
  so a swap would touch a handful of files.
- **Revisit if:** the project needs runtime message loading from a CMS or translator
  tooling (TMS) integration that next-intl does not serve.

### TypeScript 5.9 pinned over TypeScript 7

- **Chosen:** TypeScript 5.9.3, pinned exactly.
- **Alternative:** TypeScript 7 (native port) is faster but still churning through
  ecosystem incompatibilities (ESLint type-aware rules, `next-intl` type augmentation
  overloads).
- **Verdict driver:** a reference implementation must build identically on every machine.
  Speed is not the bottleneck; reproducibility is.
- **Revisit when:** `eslint-config-next` and the App Router type plugin officially support
  TS 7.

## Routing and detection

### `localePrefix: "always"` over `"as-needed"`

- **Chosen:** every page lives under an explicit locale segment (`/hi/about`).
- **Alternative:** `as-needed` serves the default locale at bare paths (`/about`), which
  produces two URLs per English page, doubles the cache keys, and complicates canonical
  URLs.
- **Cost accepted:** unprefixed deep links pay one 307 redirect.
- **Revisit if:** SEO equity for legacy unprefixed URLs becomes a hard requirement — then
  add permanent redirects from the legacy paths rather than switching the prefix policy.

### Edge proxy detection over client-side detection

- **Chosen:** `src/proxy.ts` resolves the locale before rendering (cookie → `Accept-Language`
  → default) and redirects.
- **Alternative:** detect in the browser and re-render; this flashes the wrong language on
  first paint and breaks no-JS clients (this repo asserts the no-JS path in E2E).
- **Cost accepted:** the proxy runs on every matched request. It performs header/cookie
  inspection only — no I/O — so the cost is negligible at the CDN edge.

### Static generation over per-request rendering

- **Chosen:** `generateStaticParams` + `setRequestLocale` pre-render all six locales of every
  page.
- **Alternative:** dynamic rendering per request simplifies per-user customization but
  sacrifices CDN caching and adds TTFB.
- **Cost accepted:** a content change requires a rebuild — acceptable for a
  content-in-catalog site, and the reason the 404 route is deliberately dynamic.

## Content and catalogs

### JSON catalogs over YAML / TS modules

- **Chosen:** one JSON file per locale. Tooling-friendly (every TMS and every editor reads
  JSON), diff-friendly, and importable as a typed module through `global.d.ts` augmentation.
- **Alternatives:** YAML adds a parser dependency; TS modules allow logic in catalogs, which
  is precisely what ICU messages are for.

### Graceful missing-message fallback over hard failure

- **Chosen:** a missing key renders `⚠ Namespace.key` and logs to the server console; invalid
  ICU syntax throws.
- **Rationale:** a missing translation is an operational gap that should not take a page
  down; malformed ICU is a programming error that must never render.
- **Enforcement:** `messages.test.ts` makes missing keys a test failure before they reach
  production, so the fallback is a safety net, not a workflow.

### Explicit time zone over visitor time zone

- **Chosen:** one build-time `timeZone` (`Asia/Kolkata`) shared by server and client.
- **Alternative:** format in the visitor's zone — friendlier for a global audience but
  produces hydration mismatches because the server cannot know the browser's zone.
- **Revisit when:** the app can render dates client-side only after hydration, with an
  explicit skeleton — a larger change than this demo warrants.

## Testing

### Vitest over Jest

- **Chosen:** Vitest 5 with jsdom and Testing Library. Native ESM/TS, one config file, and
  the same module resolution as the app (`@/` alias) without transform shims.
- **Alternative:** Jest remains the default in many Next.js templates but needs
  `next/jest` transform glue and is slower to start.

### Playwright over Cypress

- **Chosen:** Playwright. Multi-context tests (`Accept-Language` headers, JavaScript
  disabled) are one API call, and `webServer` manages the production server lifecycle in
  config.
- **Alternative:** Cypress has a nicer interactive runner but weaker multi-context and
  network-level control.

### Chromium-only E2E

- **Chosen:** one browser, run fast, in CI.
- **Rationale:** the risks this suite guards (routing, cookies, direction, SEO output) are
  engine-independent by construction. The engine-specific surface (browser `Intl` output) is
  asserted against the platform APIs rather than golden strings, so a Firefox/WebKit run
  would be an additive check, not a correctness fix.
- **Revisit if:** the project adopts engine-specific CSS (container queries, `:has()`
  fallbacks) or ships to a WebKit-heavy audience.

### Computed expectations over golden strings

- **Chosen:** tests derive expected values with `Intl` and `intl-messageformat`.
- **Trade-off:** tests cannot catch a *deliberate* output change on their own — but that is
  the point: they assert the app agrees with the platform, and CLDR updates cannot
  invalidate them.
- **Guard against the blind spot:** the catalog tests pin structural facts (which plural
  categories exist, which keys exist) that no CLDR release can silently change.

## Content production (video kit)

### macOS `say` over cloud TTS for narration

- **Chosen:** `say` for five locales (en, hi, ta, kn, ar) — zero cost, zero network, fully
  scriptable and reproducible.
- **Gap:** macOS ships **no Malayalam voice**. The build script skips `ml` with a loud
  warning rather than shipping Hindi audio mislabeled as Malayalam.
- **Alternatives documented in the kit:** record human narration, or synthesize with a cloud
  provider (Google Cloud TTS, Azure, ElevenLabs) — both produce a file the same pipeline
  consumes.

### Chromium-rendered slides over ffmpeg `drawtext`

- **Chosen:** slide images are rendered by headless Chromium (already a dev dependency via
  Playwright), which shapes Devanagari, Malayalam, Tamil, Kannada, and Arabic correctly
  through HarfBuzz and handles bidi natively.
- **Alternative:** ffmpeg's `drawtext` renders glyph-by-glyph without shaping — Indic
  conjuncts and Arabic joining break. A non-starter for this locale set.

## Deliberate omissions

- **No CMS integration** — catalogs are the source of truth; a CMS would add a network
  dependency to a demo whose point is determinism.
- **No i18n of images/media** — text, direction, and SEO are the demonstrated surfaces.
- **No plural-rule polyfills** — Node 20+ and all evergreen browsers ship full ICU. If a
  legacy-runtime target appears, `@formatjs/intl-pluralrules` is the drop-in.
