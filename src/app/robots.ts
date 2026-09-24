/**
 * @file Robots policy.
 *
 * Next.js serves this module at `/robots.txt`. The policy is deliberately
 * permissive — this is a public showcase — but it advertises the
 * multilingual sitemap so crawlers can enumerate every language variant.
 */
import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

/**
 * Builds the robots.txt directive.
 *
 * @returns Allow-all rule for every crawler plus the sitemap location.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
