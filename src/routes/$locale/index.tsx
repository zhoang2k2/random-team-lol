import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/")({
  beforeLoad: ({ params }) => {
    const locale = params.locale === "en" ? "en" : "vi";
    throw redirect({
      to: "/$locale/random-lol",
      params: { locale },
      replace: true,
    });
  },
  component: () => null,
});
