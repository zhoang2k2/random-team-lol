import React, { createContext, useContext, useMemo } from "react";
import { useNavigate, useParams, useMatches } from "@tanstack/react-router";
import type { Locale } from "./types";
import { DEFAULT_LOCALE } from "./types";
import { v3Translations } from "@/features/v3/locales/v3Locales";

type I18nContextType = {
  locale: Locale;
  setLocale: (nextLocale: Locale) => void;
  switchLocale: (nextLocale?: Locale) => void;
};

const I18nContext = createContext<I18nContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  switchLocale: () => {},
});

export const I18nProvider: React.FC<{
  locale: Locale;
  children: React.ReactNode;
}> = ({ locale: propLocale, children }) => {
  const navigate = useNavigate();
  const matches = useMatches();

  const locale = propLocale || DEFAULT_LOCALE;

  const switchLocale = (nextLocale?: Locale) => {
    const target = nextLocale || (locale === "vi" ? "en" : "vi");
    const currentPath = window.location.pathname;

    // Replace locale prefix in URL path
    let newPath = currentPath;
    if (currentPath.startsWith("/vi")) {
      newPath = currentPath.replace(/^\/vi/, `/${target}`);
    } else if (currentPath.startsWith("/en")) {
      newPath = currentPath.replace(/^\/en/, `/${target}`);
    } else {
      newPath = `/${target}${currentPath.startsWith("/") ? "" : "/"}${currentPath}`;
    }

    navigate({ to: newPath, replace: true });
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale: (loc: Locale) => switchLocale(loc),
      switchLocale,
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  return useContext(I18nContext);
}

export function useV3Locales() {
  const { locale } = useI18n();
  return v3Translations[locale] || v3Translations.vi;
}
