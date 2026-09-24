/**
 * @file Dynamic sitemap generation.
 *
 * Next.js serves this module at `/sitemap.xml`. For every logical route
 * (`/` and `/about`) the sitemap emits one `<url>` entry per locale, and
 * every entry carries the same `xhtml:link` alternate set. That is the
 * structure Google recommends for multilingual sites: crawlers discover
 * each language variant directly from the sitemap, without having to
 * render the pages first.
 *
 * The alternate sets come from `buildLanguageAlternates`, the same
 * helper the page metadata uses — one source of truth for hreflang.
 */
import type { MetadataRoute } from "next";

import { LOCALES } from "@/i18n/config";
import { absoluteUrl, buildLanguageAlternates, localizedPath } from "@/lib/seo";

/**
 * Logical (locale-independent) routes included in the sitemap.
 *
 * Kept as an explicit list instead of walking the filesystem so that
 * non-indexable routes can never leak into the sitemap accidentally.
 */
const INDEXABLE_ROUTES = ["/", "/about"] as const;

/**
 * Builds the multilingual sitemap.
 *
 * @returns One entry per locale per indexable route, each with the full
 * hreflang alternate map.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // A single build timestamp is shared by all entries: sitemap freshness
  // is a build-level property here, not a per-page one.
  const lastModified = new Date();

  return INDEXABLE_ROUTES.flatMap((route) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(localizedPath(locale, route)),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: route === "/" ? 1 : 0.8,
      alternates: {
        languages: buildLanguageAlternates(route),
      },
    })),
  );
}
