/**
 * @file FormattingDemo — the interactive proof that formatting follows
 * the active locale.
 *
 * A Client Component so the plural counter can be interactive. Every
 * value is rendered through `useFormatter()` and `useTranslations()`,
 * which read the locale, time zone, and named format presets from the
 * `NextIntlClientProvider` inherited from the server layout — the exact
 * same configuration the server used, which is what keeps hydration
 * deterministic.
 *
 * The demo covers the four families of locale-sensitive formatting that
 * hand-rolled `toFixed()`/`toLocaleDateString()` code usually gets wrong:
 * dates, numbers, currencies, percentages, plus ICU plural categories
 * (including Arabic's six-form plural).
 */
"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";

/**
 * Fixed instant used for the date row.
 *
 * Pinned to a constant so server HTML and client hydration always format
 * the identical input — `new Date()` at render time would be a hydration
 * mismatch waiting to happen.
 */
const DEMO_INSTANT = new Date("2026-03-14T10:30:00Z");

/**
 * Fixed pair used for the relative-time row (one day before the instant).
 * Passing an explicit `now` keeps the output ("yesterday" / "1 day ago")
 * deterministic across server, client, and tests.
 */
const DEMO_EARLIER = new Date("2026-03-13T10:30:00Z");
const DEMO_NOW = new Date("2026-03-14T10:30:00Z");

/** Large number that demonstrates grouping separators (12,34,567.89 in `en-IN`). */
const DEMO_NUMBER = 1234567.89;

/** Currency amount rendered in Indian Rupees; symbol placement varies by locale. */
const DEMO_AMOUNT = 4999.5;

/** Ratio rendered as a percentage; locale decides spacing and symbol. */
const DEMO_RATIO = 0.42;

/** Starting cart size for the plural demo — 3 exercises the `other` category. */
const INITIAL_COUNT = 3;

/**
 * Renders the locale-formatting demo section.
 *
 * @returns A definition list of formatted values plus an interactive
 * plural counter clamped to `[0, ∞)`.
 */
export function FormattingDemo() {
  const tHome = useTranslations("HomePage");
  const t = useTranslations("FormattingDemo");
  const format = useFormatter();
  const [count, setCount] = useState(INITIAL_COUNT);

  /**
   * One row per formatting family. Each `value` is produced by the
   * active locale's `Intl` rules via next-intl's formatter.
   */
  const rows = [
    {
      key: "date",
      label: t("dateLabel"),
      value: format.dateTime(DEMO_INSTANT, { dateStyle: "full", timeStyle: "short" }),
    },
    {
      key: "number",
      label: t("numberLabel"),
      value: format.number(DEMO_NUMBER),
    },
    {
      key: "currency",
      label: t("currencyLabel"),
      value: format.number(DEMO_AMOUNT, { style: "currency", currency: "INR" }),
    },
    {
      key: "percent",
      label: t("percentLabel"),
      value: format.number(DEMO_RATIO, { style: "percent" }),
    },
    {
      key: "relative",
      label: t("relativeTimeLabel"),
      value: format.relativeTime(DEMO_EARLIER, DEMO_NOW),
    },
  ] as const;

  return (
    <section id="formatting-demo" className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{tHome("demoTitle")}</h2>
        <p className="mt-3 max-w-2xl text-slate-600">{tHome("demoDescription")}</p>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.key} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <dt className="text-sm font-medium text-slate-500">{row.label}</dt>
              <dd
                data-testid={`format-${row.key}`}
                className="mt-1 text-lg font-semibold text-slate-900"
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-medium text-slate-500">{t("pluralLabel")}</h3>
          <p data-testid="plural-output" className="mt-1 text-lg font-semibold text-slate-900">
            {t("items", { count })}
          </p>
          <p className="mt-1 text-sm text-slate-500" data-testid="count-display">
            {t("countDisplay", { count })}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              aria-label={t("decrement")}
              onClick={() => setCount((current) => Math.max(0, current - 1))}
              className="h-9 w-9 rounded-lg border border-slate-300 bg-white text-lg font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
            >
              −
            </button>
            <button
              type="button"
              aria-label={t("increment")}
              onClick={() => setCount((current) => current + 1)}
              className="h-9 w-9 rounded-lg border border-slate-300 bg-white text-lg font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
