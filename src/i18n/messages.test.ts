/**
 * Message catalog validation — the test that makes translation drift a
 * build failure instead of a production surprise.
 *
 * Four properties are enforced for every locale:
 *
 * 1. **Key parity** — each catalog has exactly the same flattened key set
 *    as the English schema. A missing key would silently render a
 *    fallback marker; an extra key means dead translations.
 * 2. **Non-empty values** — no blank strings sneaking past review.
 * 3. **ICU validity** — every message compiles with the ICU parser the
 *    runtime uses (`intl-messageformat`), catching unclosed braces and
 *    malformed plural syntax at test time.
 * 4. **Plural completeness** — every `plural` message defines all CLDR
 *    plural categories the locale can select (Arabic has six; most
 *    languages have two). Missing categories are the classic
 *    localization bug this test exists to prevent.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { IntlMessageFormat } from "intl-messageformat";
import { describe, expect, it } from "vitest";

import { LOCALES, type Locale } from "./config";

/** Absolute path to the shared `messages/` directory at the repo root. */
const MESSAGES_DIR = path.resolve(import.meta.dirname, "../../messages");

/** All CLDR plural categories, in canonical order. */
const PLURAL_CATEGORIES = ["zero", "one", "two", "few", "many", "other"] as const;

/**
 * Recursively flattens a nested catalog into `dotted.path -> string`.
 *
 * @param value - Catalog node (object, string leaf, or invalid).
 * @param prefix - Accumulated dot path for the current node.
 * @returns Flat map of message key to message text.
 * @throws When a leaf is neither a string nor an object — that would be
 * an invalid catalog shape that must not pass silently.
 */
function flattenMessages(value: unknown, prefix = ""): Record<string, string> {
  if (typeof value === "string") {
    return { [prefix]: value };
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, string> = {};
    for (const [key, child] of Object.entries(value)) {
      Object.assign(result, flattenMessages(child, prefix === "" ? key : `${prefix}.${key}`));
    }
    return result;
  }
  throw new Error(`Invalid catalog node at "${prefix}": ${JSON.stringify(value)}`);
}

/**
 * Loads and flattens one locale's catalog from disk.
 *
 * @param locale - Locale whose catalog should be read.
 * @returns Flat message map for the locale.
 */
function loadCatalog(locale: Locale): Record<string, string> {
  const raw = readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), "utf8");
  return flattenMessages(JSON.parse(raw));
}

/**
 * Extracts the plural categories referenced by an ICU plural message.
 *
 * @param message - Raw ICU message text.
 * @returns Set of category names found as `category {`.
 */
function pluralCategoriesIn(message: string): Set<string> {
  const found = new Set<string>();
  for (const category of PLURAL_CATEGORIES) {
    if (new RegExp(`\\b${category}\\s*\\{`).test(message)) {
      found.add(category);
    }
  }
  return found;
}

const catalogs = Object.fromEntries(
  LOCALES.map((locale) => [locale, loadCatalog(locale)]),
) as Record<Locale, Record<string, string>>;

const englishKeys = Object.keys(catalogs.en).sort();

describe("message catalogs", () => {
  it("ships a catalog file for every configured locale", () => {
    expect(Object.keys(catalogs).sort()).toEqual([...LOCALES].sort());
  });

  it("gives every locale exactly the same key set as the English schema", () => {
    for (const locale of LOCALES) {
      expect(Object.keys(catalogs[locale]).sort(), `locale "${locale}"`).toEqual(englishKeys);
    }
  });

  it("never ships an empty message", () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(catalogs[locale])) {
        expect(value.trim(), `${locale}:${key}`).not.toBe("");
      }
    }
  });

  it("compiles every message as valid ICU", () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(catalogs[locale])) {
        expect(() => new IntlMessageFormat(value, locale), `${locale}:${key}`).not.toThrow();
      }
    }
  });

  it("covers every CLDR plural category of each locale in plural messages", () => {
    for (const locale of LOCALES) {
      const expectedCategories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
      for (const [key, value] of Object.entries(catalogs[locale])) {
        if (!value.includes("plural,")) continue;
        const found = pluralCategoriesIn(value);
        for (const category of expectedCategories) {
          expect(found, `${locale}:${key} is missing plural category "${category}"`).toContain(
            category,
          );
        }
      }
    }
  });

  it("reserves six plural forms for Arabic", () => {
    const arabicPluralKeys = Object.entries(catalogs.ar)
      .filter(([, value]) => value.includes("plural,"))
      .map(([key]) => key);
    expect(arabicPluralKeys.length).toBeGreaterThan(0);
    for (const key of arabicPluralKeys) {
      const found = pluralCategoriesIn(catalogs.ar[key] ?? "");
      expect(found.size).toBe(PLURAL_CATEGORIES.length);
    }
  });
});
