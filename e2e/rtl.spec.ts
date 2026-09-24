/**
 * E2E: right-to-left rendering.
 *
 * The `dir` attribute alone is a weak assertion — a page can declare RTL
 * and still lay out LTR. These tests assert both the attribute and the
 * *mirrored geometry* of the header: the same two elements swap sides
 * between English and Arabic, proving the logical-property utilities
 * actually respond to direction.
 */
import { expect, test } from "@playwright/test";

test.describe("right-to-left support", () => {
  test("Arabic declares lang and dir on the document element", async ({ page }) => {
    await page.goto("/ar");

    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("English declares lang and dir on the document element", async ({ page }) => {
    await page.goto("/en");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("mirrors the header geometry between LTR and RTL", async ({ page }) => {
    await page.goto("/en");
    const navLtr = await page.getByTestId("nav-home").boundingBox();
    const switcherLtr = await page.getByTestId("language-switcher").boundingBox();

    expect(navLtr).not.toBeNull();
    expect(switcherLtr).not.toBeNull();
    // LTR: navigation sits at the inline start (left), switcher at the end (right).
    expect(switcherLtr!.x).toBeGreaterThan(navLtr!.x);

    await page.goto("/ar");
    const navRtl = await page.getByTestId("nav-home").boundingBox();
    const switcherRtl = await page.getByTestId("language-switcher").boundingBox();

    expect(navRtl).not.toBeNull();
    expect(switcherRtl).not.toBeNull();
    // RTL: the same elements swap sides — mirroring happened.
    expect(switcherRtl!.x).toBeLessThan(navRtl!.x);
  });
});
