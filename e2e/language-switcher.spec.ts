/**
 * E2E: language switching.
 *
 * Verifies the three guarantees the switcher makes: the current route is
 * preserved across a language change, the explicit choice is persisted in
 * the `NEXT_LOCALE` cookie, and that cookie wins over `Accept-Language`
 * on the next visit.
 */
import { expect, test } from "@playwright/test";

import hiMessages from "../messages/hi.json";
import knMessages from "../messages/kn.json";

test.describe("language switcher", () => {
  test("preserves the current route when switching languages", async ({ page }) => {
    await page.goto("/en/about");

    await page.getByTestId("language-switcher").selectOption("hi");

    await expect(page).toHaveURL(/\/hi\/about$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(hiMessages.AboutPage.title);
  });

  test("persists the chosen locale in the NEXT_LOCALE cookie", async ({ page, context }) => {
    await page.goto("/en");

    await page.getByTestId("language-switcher").selectOption("kn");
    await expect(page).toHaveURL(/\/kn$/);

    const cookies = await context.cookies();
    const localeCookie = cookies.find((cookie) => cookie.name === "NEXT_LOCALE");
    expect(localeCookie?.value).toBe("kn");
  });

  test("routes the root path to the stored preference on the next visit", async ({ page }) => {
    await page.goto("/en");
    await page.getByTestId("language-switcher").selectOption("kn");
    await expect(page).toHaveURL(/\/kn$/);

    // Returning to the bare root must honor the cookie, not the default
    // locale and not the browser's Accept-Language header.
    await page.goto("/");
    await expect(page).toHaveURL(/\/kn$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(knMessages.HomePage.heroTitle);
  });
});
