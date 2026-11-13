import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.reactionlabgames.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep images available for rendering and search, but skip raw game builds.
        disallow: [
          "/*.html$",
          "/optimized_assets/game_assets/*/game.html",
          "/optimized_assets/game_assets/*/Build/",
          "/optimized_assets/game_assets/*/StreamingAssets/",
          "/original_assets/",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
