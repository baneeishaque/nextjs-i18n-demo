/**
 * @file Locale-aware navigation APIs.
 *
 * `createNavigation` wraps Next.js's `Link`, `redirect`, `usePathname`,
 * `useRouter`, and `getPathname` so that they automatically apply the
 * current locale — `/about` becomes `/hi/about` inside a Hindi page
 * without any manual string building.
 *
 * Re-exporting from this module (instead of calling `createNavigation`
 * at each usage site) keeps a single instance of the navigation object,
 * which matters for referential equality in memoized components and for
 * mocking in unit tests.
 */
import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware navigation primitives.
 *
 * - `Link` — drop-in replacement for `next/link` that prefixes the
 *   active locale and preserves it across navigation.
 * - `redirect` — server-side redirect honoring the active locale.
 * - `usePathname` — current pathname *without* the locale prefix, so it
 *   can be fed straight back into `useRouter().replace()` when switching
 *   languages (the new locale is supplied separately).
 * - `useRouter` — client router whose `push`/`replace` accept
 *   `{ locale }` as an option.
 * - `getPathname` — server-side URL builder used by metadata, sitemap,
 *   and canonical-link generation.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
