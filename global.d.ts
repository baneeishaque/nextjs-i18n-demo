/**
 * @file next-intl type augmentation.
 *
 * Declaring `AppConfig` here upgrades next-intl's APIs from
 * `string`-keyed to fully typed:
 *
 * - `Locale` becomes the union of supported locale codes, so passing
 *   `"fr"` to a locale-aware API is a compile error.
 * - `Messages` becomes the shape of the English catalog, so
 *   `t("HomePage.heroTitle")` is checked against the real key set and
 *   `t("HomePage.heroTitel")` fails at build time instead of rendering
 *   a fallback at runtime.
 *
 * The English catalog is the schema: every other locale is verified
 * against it by the message-parity unit test.
 *
 * Note: the imports below are deliberately *value* imports (not
 * `import type`) — `typeof` on a type-only import does not reliably
 * resolve the JSON module shape, which silently degrades every message
 * key to `never`.
 */
import { routing } from "@/i18n/routing";

import messages from "../messages/en.json";

declare module "next-intl" {
  interface AppConfig {
    /** Supported locale codes, derived from the routing table. */
    Locale: (typeof routing.locales)[number];
    /** Message schema, derived from the English catalog. */
    Messages: typeof messages;
  }
}
