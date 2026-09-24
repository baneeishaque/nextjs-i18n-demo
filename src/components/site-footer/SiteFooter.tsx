/**
 * @file Site footer.
 *
 * A Server Component rendering two localized facts: what the site is
 * built with, and the reminder that every visible string is
 * catalog-driven. The footer is intentionally text-only so it stays
 * direction-agnostic (no icons that would need mirroring in RTL).
 */
import { getTranslations } from "next-intl/server";

/**
 * Renders the footer.
 *
 * @returns Localized build note and language note.
 */
export async function SiteFooter() {
  const t = await getTranslations("Footer");

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-6 text-sm text-slate-500">
        <p>{t("builtWith")}</p>
        <p>{t("languageNote")}</p>
      </div>
    </footer>
  );
}
