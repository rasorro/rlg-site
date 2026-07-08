import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://reactionlabgames.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/*.html$", "/optimized_assets/", "/original_assets/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
