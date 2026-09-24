/**
 * Unit tests for the locale identity module.
 *
 * These tests pin the invariants the rest of the application relies on:
 * a unique locale list containing the default, an RTL set that is a
 * subset of the supported locales, correct direction mapping, and
 * non-empty display labels. If any of these breaks, dozens of downstream
 * behaviors break silently — so they are asserted here, first.
 */
import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  LOCALES,
  RTL_LOCALES,
  getDirection,
  getLocaleEnglishName,
  getLocaleLabel,
  isLocale,
  isRtlLocale,
} from "./config";

describe("locale configuration", () => {
  it("lists unique locales and includes the default locale", () => {
    expect(new Set(LOCALES).size).toBe(LOCALES.length);
    expect(LOCALES).toContain(DEFAULT_LOCALE);
  });

  it("keeps every RTL locale inside the supported locale list", () => {
    for (const locale of RTL_LOCALES) {
      expect(LOCALES).toContain(locale);
    }
  });

  it("ships six locales with English first as the default", () => {
    expect(LOCALES).toEqual(["en", "hi", "ml", "ta", "kn", "ar"]);
    expect(DEFAULT_LOCALE).toBe("en");
  });
});

describe("isLocale", () => {
  it("accepts every supported locale code", () => {
    for (const locale of LOCALES) {
      expect(isLocale(locale)).toBe(true);
    }
  });

  it("rejects unsupported codes and non-string values", () => {
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("EN")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(42)).toBe(false);
    expect(isLocale({ locale: "en" })).toBe(false);
  });
});

describe("direction helpers", () => {
  it("marks Arabic as the only RTL locale", () => {
    expect(isRtlLocale("ar")).toBe(true);
    for (const locale of LOCALES.filter((candidate) => candidate !== "ar")) {
      expect(isRtlLocale(locale)).toBe(false);
    }
  });

  it("maps locales to the HTML dir attribute", () => {
    expect(getDirection("ar")).toBe("rtl");
    expect(getDirection("en")).toBe("ltr");
    expect(getDirection("hi")).toBe("ltr");
    expect(getDirection("ml")).toBe("ltr");
    expect(getDirection("ta")).toBe("ltr");
    expect(getDirection("kn")).toBe("ltr");
  });
});

describe("locale labels", () => {
  it("provides a non-empty native label for every locale", () => {
    for (const locale of LOCALES) {
      expect(getLocaleLabel(locale).length).toBeGreaterThan(0);
    }
  });

  it("provides a non-empty English name for every locale", () => {
    for (const locale of LOCALES) {
      expect(getLocaleEnglishName(locale).length).toBeGreaterThan(0);
    }
  });

  it("uses native scripts for the native labels", () => {
    expect(getLocaleLabel("hi")).toMatch(/[\u0900-\u097F]/);
    expect(getLocaleLabel("ml")).toMatch(/[\u0D00-\u0D7F]/);
    expect(getLocaleLabel("ta")).toMatch(/[\u0B80-\u0BFF]/);
    expect(getLocaleLabel("kn")).toMatch(/[\u0C80-\u0CFF]/);
    expect(getLocaleLabel("ar")).toMatch(/[\u0600-\u06FF]/);
  });
});
