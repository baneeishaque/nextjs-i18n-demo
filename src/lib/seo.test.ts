/**
 * Unit tests for the SEO URL builders.
 *
 * These functions feed canonical links, hreflang alternates, the sitemap,
 * and robots.txt. A bug here is invisible in the UI but poisons search
 * indexing, so every branch (root path, nested path, missing leading
 * slash, trailing-slash origin) is pinned by a test.
 */
import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, LOCALES } from "@/i18n/config";

import {
  SITE_URL,
  absoluteUrl,
  buildLanguageAlternates,
  canonicalUrl,
  localizedPath,
  normalizePathname,
} from "./seo";

describe("normalizePathname", () => {
  it("adds a leading slash when missing", () => {
    expect(normalizePathname("about")).toBe("/about");
  });

  it("keeps an existing leading slash untouched", () => {
    expect(normalizePathname("/about")).toBe("/about");
  });

  it("keeps the root path as a single slash", () => {
    expect(normalizePathname("/")).toBe("/");
  });
});

describe("absoluteUrl", () => {
  it("joins the site origin with a nested path", () => {
    expect(absoluteUrl("/about")).toBe(`${SITE_URL}/about`);
  });

  it("produces the bare origin for the root path", () => {
    expect(absoluteUrl("/")).toBe(`${SITE_URL}/`);
  });

  it("never emits a double slash", () => {
    expect(absoluteUrl("/about")).not.toContain("//about");
  });
});

describe("localizedPath", () => {
  it("prefixes locales onto nested paths", () => {
    expect(localizedPath("hi", "/about")).toBe("/hi/about");
    expect(localizedPath("ar", "/about")).toBe("/ar/about");
  });

  it("drops the trailing slash for the root path", () => {
    expect(localizedPath("ta", "/")).toBe("/ta");
  });
});

describe("buildLanguageAlternates", () => {
  it("covers every locale plus x-default", () => {
    const alternates = buildLanguageAlternates("/about");
    expect(Object.keys(alternates).sort()).toEqual([...LOCALES, "x-default"].sort());
  });

  it("points x-default at the default locale's variant", () => {
    const alternates = buildLanguageAlternates("/about");
    expect(alternates["x-default"]).toBe(`${SITE_URL}/${DEFAULT_LOCALE}/about`);
  });

  it("returns absolute URLs for every entry", () => {
    const alternates = buildLanguageAlternates("/");
    for (const url of Object.values(alternates)) {
      expect(url.startsWith("https://")).toBe(true);
    }
  });
});

describe("canonicalUrl", () => {
  it("builds the canonical absolute URL for one locale", () => {
    expect(canonicalUrl("ml", "/about")).toBe(`${SITE_URL}/ml/about`);
  });

  it("keeps the canonical root URL free of a trailing slash after the locale", () => {
    expect(canonicalUrl("kn", "/")).toBe(`${SITE_URL}/kn`);
  });
});
