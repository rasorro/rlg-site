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
        url: "/assets/rlg_Logo.png",
        alt: "Reaction Lab Games logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Rapid Path",
    description:
      "Play Rapid Path on Reaction Lab Games. A simple WASD fidget/puzzle game.",
    images: ["/assets/rlg_Logo.png"],
  },
};

export default function RapidPathLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
