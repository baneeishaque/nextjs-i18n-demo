/**
 * Unit tests for the language switcher.
 *
 * The navigation layer is mocked at the module boundary, so these tests
 * assert the component's *contract*: it lists every locale, reflects the
 * active locale, and calls the locale-aware router with the current route
 * when the user picks a different language. Real navigation behavior is
 * covered end-to-end in `e2e/language-switcher.spec.ts`.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LOCALES, getLocaleLabel } from "@/i18n/config";
import enMessages from "../../../messages/en.json";

import { LanguageSwitcher } from "./LanguageSwitcher";

/**
 * Router spy. Declared via `vi.hoisted` because `vi.mock` factories are
 * hoisted above imports and must not reference uninitialized bindings.
 */
const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/about",
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
}));

/**
 * Renders the switcher inside a real i18n provider.
 *
 * @param locale - Locale to activate for the render.
 * @returns Testing Library render result.
 */
function renderSwitcher(locale: "en" | "hi" | "ar" = "en") {
  return render(
    <NextIntlClientProvider locale={locale} messages={enMessages}>
      <LanguageSwitcher />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  replaceMock.mockClear();
});

describe("LanguageSwitcher", () => {
  it("renders one option per supported locale, labeled in its native script", () => {
    renderSwitcher();

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(LOCALES.length);
    expect(options.map((option) => option.textContent)).toEqual(
      LOCALES.map((locale) => getLocaleLabel(locale)),
    );
  });

  it("exposes an accessible name from the message catalog", () => {
    renderSwitcher();

    expect(
      screen.getByRole("combobox", { name: enMessages.LocaleSwitcher.label }),
    ).toBeInTheDocument();
  });

  it("reflects the active locale as the selected value", () => {
    renderSwitcher("hi");

    expect(screen.getByTestId("language-switcher")).toHaveValue("hi");
  });

  it("navigates to the same route in the newly selected locale", async () => {
    const user = userEvent.setup();
    renderSwitcher("en");

    await user.selectOptions(screen.getByTestId("language-switcher"), "ar");

    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith({ pathname: "/about", params: {} }, { locale: "ar" });
  });

  it("does not navigate when the selection is unchanged", async () => {
    const user = userEvent.setup();
    renderSwitcher("en");

    await user.selectOptions(screen.getByTestId("language-switcher"), "en");

    expect(replaceMock).not.toHaveBeenCalled();
  });
});
