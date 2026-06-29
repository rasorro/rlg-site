import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rapid Path",
  description:
    "Play Rapid Path on Reaction Lab Games. A simple WASD fidget/puzzle game.",
  alternates: {
    canonical: "/rapid-path",
  },
  openGraph: {
    title: "Rapid Path",
    description:
      "Play Rapid Path on Reaction Lab Games. A simple WASD fidget/puzzle game.",
    url: "/rapid-path",
    siteName: "Reaction Lab Games",
    type: "website",
    images: [
      {
        url: "/optimized_assets/global_assets/rlg_Logo.webp",
        alt: "Reaction Lab Games logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Rapid Path",
    description:
      "Play Rapid Path on Reaction Lab Games. A simple WASD fidget/puzzle game.",
    images: ["/optimized_assets/global_assets/rlg_Logo.webp"],
  },
};

export default function RapidPathLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
