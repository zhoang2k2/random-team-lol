import React from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { I18nProvider } from "@/i18n/I18nContext";
import type { Locale } from "@/i18n/types";

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }) => {
    const { locale } = params;
    if (locale !== "vi" && locale !== "en") {
      throw redirect({
        to: "/$locale/random-lol",
        params: { locale: "vi" },
        replace: true,
      });
    }
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  const { locale } = Route.useParams();
  const validLocale: Locale = locale === "en" ? "en" : "vi";

  return (
    <I18nProvider locale={validLocale}>
      <Outlet />
    </I18nProvider>
  );
}
