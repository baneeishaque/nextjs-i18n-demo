/**
 * @file Root layout for every localized route.
 *
 * Because every user-visible route lives under `[locale]`, this layout —
 * not a top-level `app/layout.tsx` — is the application's root layout. It
 * owns the `<html>` element and therefore the two locale-critical
 * attributes:
 *
 * - `lang` — the BCP-47 language code, used by screen readers, browser
 *   translation prompts, and search engines.
 * - `dir` — the text direction. Arabic flips to `rtl`; every other locale
 *   stays `ltr`. Because layout utilities throughout the app are logical
 *   (`ps-*`, `me-*`, `text-start`), this single attribute mirrors the
 *   entire UI with zero per-locale CSS.
 *
 * The layout also:
 * 1. Statically pre-renders one page tree per locale
 *    (`generateStaticParams`).
 * 2. Rejects unknown locale segments with a 404 (`hasLocale` guard).
 * 3. Opts the request into static rendering (`setRequestLocale`).
 * 4. Serializes the i18n configuration to Client Components
 *    (`NextIntlClientProvider` inherits locale, messages, formats, and
 *    time zone from `src/i18n/request.ts` automatically).
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDirection, isLocale } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";

import "../globals.css";

/**
 * Props every page and layout under `[locale]` receives.
 *
 * Next.js 16 passes `params` as a Promise; awaiting it is mandatory
 * before reading the locale segment.
 */
type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Pre-renders one layout instance per supported locale at build time.
 *
 * With `localePrefix: "always"`, this means `/en`, `/hi`, `/ml`, `/ta`,
 * `/kn`, and `/ar` (and every nested page) are emitted as static HTML,
 * so production requests are served from the CDN without running React.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Builds document-level metadata shared by all pages.
 *
 * Page-level `generateMetadata` functions override `title` and
 * `description`; `metadataBase` here is what allows Next.js to resolve
 * any relative canonical/alternate URL to the production origin.
 *
 * @param props - Route props containing the awaited locale segment.
 * @returns The base metadata for the document.
 */
export async function generateMetadata({
  params,
}: Omit<LocaleLayoutProps, "children">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // The namespace is passed as an explicit generic because TypeScript
  // widens the `namespace` property to `string` inside the object-form
  // overload (no literal inference), which would degrade every message
  // key to `never`. The generic keeps both the namespace and its keys
  // fully type-checked against the English catalog.
  const t = await getTranslations<"Metadata">({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("siteName"),
      template: `%s | ${t("siteName")}`,
    },
    description: t("siteDescription"),
    applicationName: t("siteName"),
  };
}

/**
 * Renders the localized document shell.
 *
 * @param props - The child page tree plus the locale route segment.
 * @returns The `<html>` document wrapping header, page content, and footer.
 */
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // A locale segment that is not in the routing table (e.g. `/xx`) is a
  // client error, not a language: render the 404 page instead of letting
  // a malformed locale flow into message loading.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Opts this request into static rendering: without it, next-intl must
  // fall back to dynamic rendering because the locale would otherwise be
  // read from request headers at render time.
  setRequestLocale(locale);

  return (
    <html lang={locale} dir={getDirection(locale)}>
      <body className="flex min-h-dvh flex-col">
        {/* Client Components (language switcher, formatting demo) inherit
            locale, messages, formats, and time zone from the server. */}
        <NextIntlClientProvider>
          <SiteHeader />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
