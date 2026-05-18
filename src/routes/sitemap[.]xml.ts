import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://random-team-lol.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/aram-random", changefreq: "monthly", priority: "0.9" },
          { path: "/custom-game-random", changefreq: "monthly", priority: "0.9" },
          { path: "/random-lane", changefreq: "monthly", priority: "0.8" },
          { path: "/chia-team-lien-minh", changefreq: "monthly", priority: "0.9" },
          { path: "/huong-dan", changefreq: "monthly", priority: "0.7" },
          { path: "/faq", changefreq: "monthly", priority: "0.6" },
          { path: "/cmvn", changefreq: "yearly", priority: "0.5" },
        ];

        const urls = entries.map(
          (e) =>
            `  <url><loc>${BASE_URL}${e.path}</loc>${
              e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : ""
            }${e.priority ? `<priority>${e.priority}</priority>` : ""}</url>`,
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
