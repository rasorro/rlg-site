import type { NextConfig } from "next";

// Production is Apache (public/.htaccess), which serves the pre-compressed Unity .br files.
// `next dev` doesn't, so mirror that here, dev only (the static export can't use rewrites/headers).
const unity = (ext: string) => `/optimized_assets/game_assets/:game/Build/:build/Build/:file.${ext}`;
const types: Record<string, string> = {
  data: "application/octet-stream",
  "framework.js": "application/javascript",
  wasm: "application/wasm",
};

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  allowedDevOrigins: ["192.168.1.*"],
  images: { unoptimized: true },
  ...(process.env.NODE_ENV === "development" && {
    rewrites: async () => ({
      beforeFiles: Object.keys(types).map((ext) => ({ source: unity(ext), destination: `${unity(ext)}.br` })),
      afterFiles: [],
      fallback: [],
    }),
    headers: async () =>
      Object.entries(types).map(([ext, type]) => ({
        source: unity(ext),
        headers: [
          { key: "Content-Encoding", value: "br" },
          { key: "Content-Type", value: type },
        ],
      })),
  }),
};

export default nextConfig;
