/**
 * Unit tests for the formatting demo.
 *
 * Expected values are computed with the platform's own `Intl` APIs and
 * `intl-messageformat` — the same engines the component uses through
 * next-intl. That keeps the assertions honest (no hardcoded strings that
 * could drift from CLDR data) while still pinning the exact output:
 * dates in the configured time zone, locale number grouping, currency
 * and percent formatting, relative time, and ICU plural branches —
 * including Arabic's dual form and Eastern Arabic numerals.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IntlMessageFormat } from "intl-messageformat";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import arMessages from "../../../messages/ar.json";
import enMessages from "../../../messages/en.json";

import { FormattingDemo } from "./FormattingDemo";

/** Must match the time zone configured in `src/i18n/request.ts`. */
const TIME_ZONE = "Asia/Kolkata";

/** Mirrors the constants inside `FormattingDemo.tsx`. */
const DEMO_INSTANT = new Date("2026-03-14T10:30:00Z");
const DEMO_EARLIER = new Date("2026-03-13T10:30:00Z");
const DEMO_NOW = new Date("2026-03-14T10:30:00Z");

/**
 * Whole days between the demo's "earlier" and "now" instants, with the
 * same sign convention as next-intl (negative = in the past).
 */
const RELATIVE_DELTA_DAYS = Math.round((DEMO_EARLIER.getTime() - DEMO_NOW.getTime()) / 86_400_000);

/**
 * Renders the demo inside a real i18n provider with an explicit time
 * zone, exactly as the server layout does.
 *
 * @param locale - Locale catalog to activate.
 * @returns Testing Library render result.
 */
function renderDemo(locale: "en" | "ar") {
  const messages = locale === "en" ? enMessages : arMessages;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={TIME_ZONE}>
      <FormattingDemo />
    </NextIntlClientProvider>,
  );
}

/**
 * Renders an ICU message with the reference implementation.
 *
 * @param message - Raw ICU message text.
 * @param locale - Locale used for plural/number rules.
 * @param values - Interpolation values.
 * @returns The formatted string.
 */
function renderIcu(message: string, locale: string, values: Record<string, number>): string {
  return new IntlMessageFormat(message, locale).format(values) as string;
}

describe("FormattingDemo (English)", () => {
  it("formats the date with the configured time zone", () => {
    renderDemo("en");

    const expected = new Intl.DateTimeFormat("en", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: TIME_ZONE,
    }).format(DEMO_INSTANT);

    expect(screen.getByTestId("format-date")).toHaveTextContent(expected);
  });

  it("formats the number with locale grouping", () => {
    renderDemo("en");

    expect(screen.getByTestId("format-number")).toHaveTextContent(
      new Intl.NumberFormat("en").format(1234567.89),
    );
  });

  it("formats the currency amount in Indian Rupees", () => {
    renderDemo("en");

    expect(screen.getByTestId("format-currency")).toHaveTextContent(
      new Intl.NumberFormat("en", { style: "currency", currency: "INR" }).format(4999.5),
    );
  });

  it("formats the ratio as a percentage", () => {
    renderDemo("en");

    expect(screen.getByTestId("format-percent")).toHaveTextContent(
      new Intl.NumberFormat("en", { style: "percent" }).format(0.42),
    );
  });

  it("formats relative time with an explicit now", () => {
    renderDemo("en");

    expect(screen.getByTestId("format-relative")).toHaveTextContent(
      new Intl.RelativeTimeFormat("en", { numeric: "always" }).format(RELATIVE_DELTA_DAYS, "day"),
    );
  });

  it("renders the starting plural count of three", () => {
    renderDemo("en");

    expect(screen.getByTestId("plural-output")).toHaveTextContent(
      renderIcu(enMessages.FormattingDemo.items, "en", { count: 3 }),
    );
  });

  it("switches to the singular branch when the count reaches one", async () => {
    const user = userEvent.setup();
    renderDemo("en");

    const decrement = screen.getByRole("button", {
      name: enMessages.FormattingDemo.decrement,
    });
    await user.click(decrement);
    await user.click(decrement);

    expect(screen.getByTestId("count-display")).toHaveTextContent(
      renderIcu(enMessages.FormattingDemo.countDisplay, "en", { count: 1 }),
    );
    expect(screen.getByTestId("plural-output")).toHaveTextContent(
      renderIcu(enMessages.FormattingDemo.items, "en", { count: 1 }),
    );
  });

  it("switches to the explicit zero branch at zero and never goes negative", async () => {
    const user = userEvent.setup();
    renderDemo("en");

    const decrement = screen.getByRole("button", {
      name: enMessages.FormattingDemo.decrement,
    });
    for (let click = 0; click < 5; click += 1) {
      await user.click(decrement);
    }

    expect(screen.getByTestId("plural-output")).toHaveTextContent(
      renderIcu(enMessages.FormattingDemo.items, "en", { count: 0 }),
    );
    expect(screen.getByTestId("count-display")).toHaveTextContent(
      renderIcu(enMessages.FormattingDemo.countDisplay, "en", { count: 0 }),
    );
  });

  it("increments the count with the add button", async () => {
    const user = userEvent.setup();
    renderDemo("en");

    await user.click(screen.getByRole("button", { name: enMessages.FormattingDemo.increment }));

    expect(screen.getByTestId("plural-output")).toHaveTextContent(
      renderIcu(enMessages.FormattingDemo.items, "en", { count: 4 }),
    );
  });
});

describe("FormattingDemo (Arabic)", () => {
  it("renders numbers with Eastern Arabic numerals", () => {
    renderDemo("ar");

    expect(screen.getByTestId("format-number")).toHaveTextContent(
      new Intl.NumberFormat("ar").format(1234567.89),
    );
  });

  it("selects the dual plural form for a count of two", async () => {
    const user = userEvent.setup();
    renderDemo("ar");

    await user.click(screen.getByRole("button", { name: arMessages.FormattingDemo.decrement }));

    expect(screen.getByTestId("plural-output")).toHaveTextContent(
      renderIcu(arMessages.FormattingDemo.items, "ar", { count: 2 }),
    );
  });
});
