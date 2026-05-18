export const SITE_URL = "https://random-team-lol.lovable.app";
export const SITE_NAME = "Nghiện LOL";
export const DEFAULT_OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9f46e38b-7f65-4499-90d0-f533ae0b30bd/id-preview-59dea75c--798fb065-8b64-41bc-a26e-91489f067067.lovable.app-1778658824543.png";

export type SeoMetaInput = {
  title: string;
  description: string;
  path: string; // e.g. "/aram-random"
  ogType?: "website" | "article";
  image?: string;
};

export function buildSeoMeta({
  title,
  description,
  path,
  ogType = "website",
  image = DEFAULT_OG_IMAGE,
}: SeoMetaInput) {
  const url = `${SITE_URL}${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: ogType },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
