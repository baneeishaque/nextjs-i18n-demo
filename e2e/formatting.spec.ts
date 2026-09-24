/**
 * E2E: locale-aware formatting in a real browser.
 *
 * The unit tests already verify the component against Node's `Intl`
 * implementation; these tests verify the *browser's* implementation and
 * the full hydration path. Expected values are computed with
 * `intl-messageformat` and the platform `Intl` APIs, so nothing is
 * hardcoded and CLDR updates cannot silently invalidate the assertions.
 */
import { expect, test } from "@playwright/test";
import { IntlMessageFormat } from "intl-messageformat";

import arMessages from "../messages/ar.json";
import hiMessages from "../messages/hi.json";

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

test.describe("locale-aware formatting", () => {
  test("Hindi page formats numbers with Indian digit grouping", async ({ page }) => {
    await page.goto("/hi");

    await expect(page.getByTestId("format-number")).toHaveText(
      new Intl.NumberFormat("hi").format(1234567.89),
    );
    await expect(page.getByTestId("format-currency")).toHaveText(
      new Intl.NumberFormat("hi", { style: "currency", currency: "INR" }).format(4999.5),
    );
  });

  test("Arabic page formats numbers with Eastern Arabic numerals", async ({ page }) => {
    await page.goto("/ar");

    await expect(page.getByTestId("format-number")).toHaveText(
      new Intl.NumberFormat("ar").format(1234567.89),
    );
  });

  test("pluralization reacts to the counter", async ({ page }) => {
    await page.goto("/hi");

    const output = page.getByTestId("plural-output");
    await expect(output).toHaveText(renderIcu(hiMessages.FormattingDemo.items, "hi", { count: 3 }));

    await page.getByRole("button", { name: hiMessages.FormattingDemo.increment }).click();
    await expect(output).toHaveText(renderIcu(hiMessages.FormattingDemo.items, "hi", { count: 4 }));

    const decrement = page.getByRole("button", { name: hiMessages.FormattingDemo.decrement });
    await decrement.click();
    await decrement.click();
    await decrement.click();
    await expect(output).toHaveText(renderIcu(hiMessages.FormattingDemo.items, "hi", { count: 1 }));
  });

  test("Arabic pluralization uses the dual form for a count of two", async ({ page }) => {
    await page.goto("/ar");

    await page.getByRole("button", { name: arMessages.FormattingDemo.decrement }).click();

    await expect(page.getByTestId("plural-output")).toHaveText(
      renderIcu(arMessages.FormattingDemo.items, "ar", { count: 2 }),
    );
  });
});
