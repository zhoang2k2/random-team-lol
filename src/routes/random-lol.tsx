import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_LOCALE } from "@/i18n/types";

export const Route = createFileRoute("/random-lol")({
  beforeLoad: () => {
    throw redirect({
      to: "/$locale/random-lol",
      params: { locale: DEFAULT_LOCALE },
      replace: true,
    });
  },
  component: () => null,
});
