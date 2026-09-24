/**
 * @file Site header — brand, primary navigation, and the language
 * switcher.
 *
 * A Server Component: navigation labels come from the message catalog at
 * render time and the only interactive island (the switcher) is a Client
 * Component. Keeping the header on the server means zero locale strings
 * are shipped twice.
 *
 * Accessibility: a "skip to content" link is the first focusable element,
 * a WCAG requirement for pages with repeated navigation.
 */
import { getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "@/i18n/navigation";

/**
 * Renders the sticky header.
 *
 * @returns Skip link, brand, navigation links, and the locale picker.
 */
export async function SiteHeader() {
  const t = await getTranslations("Nav");
  const tMeta = await getTranslations("Metadata");

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t("skipToContent")}
      </a>
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-bold tracking-tight text-slate-900">
            {tMeta("siteName")}
          </Link>
          <nav aria-label={tMeta("siteName")} className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
              data-testid="nav-home"
            >
              {t("home")}
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
              data-testid="nav-about"
            >
              {t("about")}
            </Link>
          </nav>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
