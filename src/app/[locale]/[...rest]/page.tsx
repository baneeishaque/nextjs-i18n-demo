/**
 * @file Catch-all route that turns every unknown path under a valid
 * locale into the localized 404 page.
 *
 * Without this file, `/hi/does-not-exist` would be handled by Next's
 * default not-found, which lives outside the `[locale]` segment and
 * therefore cannot read the message catalog. By matching every unmatched
 * segment here and immediately calling `notFound()`, the 404 is rendered
 * by `[locale]/not-found.tsx` inside the localized layout.
 */
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { isLocale } from "@/i18n/config";

/**
 * Props for the catch-all page: the locale plus the unused rest segment.
 */
type CatchAllPageProps = {
  params: Promise<{ locale: string; rest: string[] }>;
};

/**
 * Immediately raises the localized 404 for any unknown path.
 *
 * @param props - Route props containing the locale and rest segments.
 */
export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { locale } = await params;
  if (isLocale(locale)) {
    setRequestLocale(locale);
  }
  notFound();
}
