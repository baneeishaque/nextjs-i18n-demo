/**
 * @file Language switcher — the primary way users change locale.
 *
 * A Client Component because changing locale is a client-side navigation:
 * it must preserve the current route and scroll state. The switcher
 * renders a native `<select>`, which is deliberately boring technology:
 * it is keyboard-accessible, screen-reader-friendly, and works on every
 * mobile platform without custom JS — all things custom dropdowns
 * routinely get wrong.
 *
 * Switching mechanics: `usePathname()` returns the path *without* the
 * locale prefix; `router.replace({pathname, params}, {locale})` re-renders
 * the same route under the new locale and updates the `NEXT_LOCALE`
 * cookie, so the choice persists on the next visit.
 */
"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { DEFAULT_LOCALE, isLocale, LOCALES, getLocaleLabel } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";

/**
 * Renders a locale picker labeled in the active language.
 *
 * @returns An accessible `<select>` listing every supported locale by its
 * native name.
 */
export function LanguageSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  // `useLocale()` is typed as string; narrow it to the Locale union. The
  // fallback can only trigger if the provider was misconfigured, in which
  // case defaulting is safer than rendering an invalid selection.
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  /**
   * Navigates to the same route in the newly selected locale.
   *
   * @param event - Change event from the native select element.
   */
  function onSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;
    // Ignore invalid values and no-op selections: re-selecting the active
    // locale must not trigger a redundant navigation (or a cookie write).
    if (!isLocale(nextLocale) || nextLocale === locale) return;

    router.replace(
      // @ts-expect-error -- TypeScript validates that only known `params`
      // are used with a given `pathname`. Since the two always match for
      // the current route, the runtime check can be skipped here.
      { pathname, params },
      { locale: nextLocale },
    );
  }

  return (
    <select
      aria-label={t("label")}
      data-testid="language-switcher"
      value={locale}
      onChange={onSelectChange}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
    >
      {LOCALES.map((option) => (
        <option key={option} value={option}>
          {getLocaleLabel(option)}
        </option>
      ))}
    </select>
  );
}
