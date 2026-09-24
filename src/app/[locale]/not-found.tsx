/**
 * @file Localized 404 page.
 *
 * Rendered by `notFound()` calls inside the `[locale]` segment (see
 * `[...rest]/page.tsx`). It uses `useTranslations`, which resolves
 * against the locale provided by the enclosing layout, so a Hindi URL
 * gets a Hindi 404 — a small detail that most multilingual sites miss.
 */
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

/**
 * Renders the localized not-found message with a route back home.
 *
 * @returns The 404 content for the active locale.
 */
export default function NotFoundPage() {
  const t = useTranslations("NotFound");

  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="text-sm font-semibold tracking-wide text-indigo-600 uppercase">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
      <p className="mt-4 text-slate-600">{t("description")}</p>
      <p className="mt-8">
        <Link
          href="/"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          {t("backHome")}
        </Link>
      </p>
    </section>
  );
}
