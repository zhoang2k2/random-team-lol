export const SITE_URL = "https://random-team-lol.lovable.app";
export const SITE_NAME = "Random Liên Minh";
export const DEFAULT_OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9f46e38b-7f65-4499-90d0-f533ae0b30bd/id-preview-59dea75c--798fb065-8b64-41bc-a26e-91489f067067.lovable.app-1778658824543.png";

export type SeoMetaInput = {
  title?: string;
  description?: string;
  path: string;
  ogType?: "website" | "article";
  image?: string;
  author?: string;
  locale?: "vi" | "en";
};

export function buildSeoMeta({
  title,
  description,
  path,
  ogType = "website",
  image = DEFAULT_OG_IMAGE,
  author = "zhoang2k2",
  locale = "vi",
}: SeoMetaInput) {
  const isEn = locale === "en";

  const finalTitle =
    title ||
    (isEn
      ? "Random Liên Minh — League of Legends Team Randomizer"
      : "Random Liên Minh — Random Team Liên Minh Huyền Thoại");

  const finalDesc =
    description ||
    (isEn
      ? "A League of Legends team randomizer"
      : "Công cụ random team, lane, tướng cho Liên Minh Huyền Thoại — custom, ARAM, đấu nội bộ.");

  const ogDesc = isEn
    ? "Random teams, lanes, and champions for League of Legends custom games."
    : "Random team, lane và tướng cho các trận custom Liên Minh Huyền Thoại.";

  const ogLocale = isEn ? "en_US" : "vi_VN";
  const cleanPath = path.replace(/^\/(vi|en)/, "") || "/random-lol";
  const url = `${SITE_URL}/${locale}${cleanPath}`;

  return {
    meta: [
      { title: finalTitle },
      { name: "description", content: finalDesc },
      { name: "author", content: author },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: ogType },
      { property: "og:title", content: finalTitle },
      { property: "og:description", content: ogDesc },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: ogLocale },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: finalTitle },
      { name: "twitter:description", content: finalDesc },
      { name: "twitter:image", content: image },
    ],
    links: [
      { rel: "canonical", href: url },
      { rel: "alternate", hrefLang: "vi", href: `${SITE_URL}/vi${cleanPath}` },
      { rel: "alternate", hrefLang: "en", href: `${SITE_URL}/en${cleanPath}` },
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/vi${cleanPath}` },
    ],
  };
}
