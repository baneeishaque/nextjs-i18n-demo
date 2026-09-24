/**
 * E2E: locale routing.
 *
 * Verifies the URL contract end to end — root redirects, per-locale
 * rendering, locale-preserving navigation, localized 404s, and
 * `Accept-Language` detection — against the production build where the
 * proxy (middleware) and static generation actually run.
 */
import { expect, test } from "@playwright/test";

import arMessages from "../messages/ar.json";
import enMessages from "../messages/en.json";
import hiMessages from "../messages/hi.json";
import knMessages from "../messages/kn.json";
import mlMessages from "../messages/ml.json";
import taMessages from "../messages/ta.json";

/** Hero title per locale, sourced from the catalogs (no hardcoded copy). */
const HERO_BY_LOCALE = {
  en: enMessages.HomePage.heroTitle,
  hi: hiMessages.HomePage.heroTitle,
  ml: mlMessages.HomePage.heroTitle,
  ta: taMessages.HomePage.heroTitle,
  kn: knMessages.HomePage.heroTitle,
  ar: arMessages.HomePage.heroTitle,
} as const;

test.describe("locale routing", () => {
  test("redirects the root path to the default locale", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
  });

  test("renders the localized hero for every configured locale", async ({ page }) => {
    for (const [locale, hero] of Object.entries(HERO_BY_LOCALE)) {
      await page.goto(`/${locale}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(hero);
    }
  });

  test("keeps the locale prefix during in-app navigation", async ({ page }) => {
    await page.goto("/ta");
    await page.getByTestId("nav-about").click();

    await expect(page).toHaveURL(/\/ta\/about$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(taMessages.AboutPage.title);
  });

  test("returns a localized 404 for unknown paths under a valid locale", async ({ page }) => {
    const response = await page.goto("/ml/definitely-not-a-page");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(mlMessages.NotFound.title);
  });

  test("detects the visitor's language from Accept-Language", async ({ browser }) => {
    const context = await browser.newContext({ locale: "hi-IN" });
    const page = await context.newPage();

    await page.goto("/");

    await expect(page).toHaveURL(/\/hi$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(hiMessages.HomePage.heroTitle);

    await context.close();
  });

  test("serves fully rendered HTML without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto("/kn");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(knMessages.HomePage.heroTitle);
    await expect(page.getByTestId("format-number")).toHaveText(
      new Intl.NumberFormat("kn").format(1234567.89),
    );

    await context.close();
  });
});
