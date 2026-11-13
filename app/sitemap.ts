import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const baseUrl = "https://www.reactionlabgames.com";

// No lastModified/changeFrequency on purpose: stamping every page with the build time on each deploy is inaccurate,
// and Google ignores both when they aren't trustworthy.
const PAGES: [path: string, priority: number][] = [
  ["/", 1],
  ["/rapid-path/", 0.9],
  ["/stickman-skydive/", 0.9],
  ["/about/", 0.6],
  ["/contact/", 0.6],
  ["/swerve/", 0.5],
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(([path, priority]) => ({ url: `${baseUrl}${path}`, priority }));
}
