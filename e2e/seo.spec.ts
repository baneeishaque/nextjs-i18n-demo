/**
 * E2E: SEO surfaces.
 *
 * Asserts the machine-readable outputs that search engines consume:
 * canonical links, the full hreflang alternate set (including
 * `x-default`), the multilingual sitemap with `xhtml:link` alternates,
 * the robots policy, and localized page titles.
 */
import { expect, test } from "@playwright/test";

import { LOCALES } from "../src/i18n/config";
import taMessages from "../messages/ta.json";

test.describe("SEO", () => {
  test("home page exposes canonical and the full hreflang alternate set", async ({ page }) => {
    await page.goto("/hi");

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/hi$/);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(LOCALES.length + 1);
    await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute("href", /\/en$/);

    for (const locale of LOCALES) {
      await expect(page.locator(`link[hreflang="${locale}"]`)).toHaveAttribute(
        "href",
        new RegExp(`/${locale}$`),
      );
    }
  });

  test("about page exposes its own canonical URL", async ({ page }) => {
    await page.goto("/ar/about");

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/ar\/about$/);
  });

  test("sitemap lists every locale for every indexable route with alternates", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const urlEntries = xml.match(/<url>/g) ?? [];
    // Two indexable routes (`/` and `/about`) times six locales.
    expect(urlEntries).toHaveLength(LOCALES.length * 2);

    for (const locale of LOCALES) {
      expect(xml).toContain(`/${locale}/about`);
    }
    expect(xml).toContain('hreflang="x-default"');
  });

  test("robots.txt allows crawling and advertises the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain("User-Agent: *");
    expect(body).toContain("Allow: /");
    expect(body).toContain("Sitemap:");
  });

  test("page titles are localized", async ({ page }) => {
    await page.goto("/ta/about");

    const title = await page.title();
    expect(title).toContain(taMessages.Metadata.about.title);
  });
});
