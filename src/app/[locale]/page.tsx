/**
 * @file Home page — the multilingual showcase entry point.
 *
 * Demonstrates, in one statically-rendered page per locale:
 * - localized hero copy and calls to action from the message catalog,
 * - feature cards whose titles/descriptions are catalog-driven,
 * - the interactive `FormattingDemo` island (dates, numbers, currencies,
 *   percentages, relative time, and ICU plurals).
 *
 * SEO: `generateMetadata` emits a per-locale title/description plus the
 * canonical URL and the full hreflang alternate set, so each language
 * variant is indexed as its own page with correct cross-references.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FormattingDemo } from "@/components/formatting-demo";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/config";
import { buildLanguageAlternates, canonicalUrl } from "@/lib/seo";

/**
 * Feature cards rendered on the home page, in display order.
 *
 * Declared as a literal tuple so the mapped message keys
 * (`features.<key>.title`) stay type-checked against the catalog.
 */
const FEATURE_KEYS = ["routing", "rtl", "formatting", "seo"] as const;

/**
 * Page props: the awaited locale route segment.
 */
type HomePageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Per-locale metadata for the home page.
 *
 * @param props - Route props containing the locale segment.
 * @returns Title, description, canonical, and hreflang alternates.
 */
export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Explicit namespace generic — see layout.tsx for the inference note.
  const t = await getTranslations<"Metadata.home">({ locale, namespace: "Metadata.home" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalUrl(locale, "/"),
      languages: buildLanguageAlternates("/"),
    },
  };
}

/**
 * Renders the localized home page.
 *
 * @param props - Route props containing the locale segment.
 * @returns Hero, feature grid, and the formatting demo island.
 */
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Enables static generation for this page per locale.
  setRequestLocale(locale);

  const t = await getTranslations("HomePage");

  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-start sm:py-24">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-600">{t("heroSubtitle")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/about"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              {t("primaryCta")}
            </Link>
            <a
              href="#formatting-demo"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {t("secondaryCta")}
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t("featuresTitle")}</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {FEATURE_KEYS.map((key) => (
            <li
              key={key}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              data-testid={`feature-${key}`}
            >
              <h3 className="text-base font-semibold text-slate-900">
                {t(`features.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t(`features.${key}.description`)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <FormattingDemo />
    </>
  );
}
