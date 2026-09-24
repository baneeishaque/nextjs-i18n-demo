/**
 * @file About page — how the multilingual demo is assembled.
 *
 * Serves two audiences:
 * - **Developers** evaluating the pattern: the page lists the concrete
 *   mechanisms (routing, detection, RTL, formatting, SEO, testing).
 * - **Search engines**: it is a second localized, canonicalized,
 *   hreflang-linked route, which proves the alternate-link strategy
 *   scales beyond a single page.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/config";
import { buildLanguageAlternates, canonicalUrl } from "@/lib/seo";

/**
 * Mechanism list keys, in display order. Typed as a literal tuple so the
 * mapped catalog lookups stay type-checked.
 */
const MECHANISM_KEYS = ["routing", "detection", "rtl", "formatting", "seo", "testing"] as const;

/**
 * Trade-off keys, in display order.
 */
const TRADEOFF_KEYS = ["prefix", "detection", "library"] as const;

/**
 * Page props: the awaited locale route segment.
 */
type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Per-locale metadata for the about page.
 *
 * @param props - Route props containing the locale segment.
 * @returns Title, description, canonical, and hreflang alternates.
 */
export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Explicit namespace generic — see layout.tsx for the inference note.
  const t = await getTranslations<"Metadata.about">({ locale, namespace: "Metadata.about" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalUrl(locale, "/about"),
      languages: buildLanguageAlternates("/about"),
    },
  };
}

/**
 * Renders the localized about page.
 *
 * @param props - Route props containing the locale segment.
 * @returns Intro, mechanism list, trade-off list, and a back link.
 */
export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);

  const t = await getTranslations("AboutPage");

  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
      <p className="mt-4 text-lg text-slate-600">{t("intro")}</p>

      <h2 className="mt-12 text-xl font-semibold text-slate-900">{t("mechanismsTitle")}</h2>
      <ul className="mt-4 list-disc space-y-2 ps-6 text-slate-700">
        {MECHANISM_KEYS.map((key) => (
          <li key={key} data-testid={`mechanism-${key}`}>
            {t(`mechanisms.${key}`)}
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-xl font-semibold text-slate-900">{t("tradeoffsTitle")}</h2>
      <ul className="mt-4 list-disc space-y-2 ps-6 text-slate-700">
        {TRADEOFF_KEYS.map((key) => (
          <li key={key} data-testid={`tradeoff-${key}`}>
            {t(`tradeoffs.${key}`)}
          </li>
        ))}
      </ul>

      <p className="mt-12">
        <Link href="/" className="font-semibold text-indigo-600 hover:text-indigo-500">
          {t("backHome")}
        </Link>
      </p>
    </article>
  );
}
