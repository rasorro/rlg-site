import type { Metadata } from "next";
import { Coiny } from "next/font/google";
import "./globals.css";
import AppShell from "./app-shell";
import { UiProvider } from "./ui-context";
import { LAYOUT_FLAGS_SCRIPT } from "./home-layout";

const universalFont = Coiny({
  weight: "400",
  variable: "--font-bagel-fat-one",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.reactionlabgames.com"),
  title: {
    default: "Reaction Lab Games",
    template: "%s | Reaction Lab Games",
  },
  description:
    "Welcome to Reaction Lab Games! Play Rapid Path for free now! Coming soon: Stickman-Skydive-Simulator, Swerve.",
  applicationName: "Reaction Lab Games",
  openGraph: {
    title: "Reaction Lab Games",
    description:
      "Welcome to Reaction Lab Games! Play Rapid Path for free now! Coming soon: Stickman-Skydive-Simulator, Swerve.",
    siteName: "Reaction Lab Games",
    type: "website",
    images: [
      {
        url: "/optimized_assets/global_assets/rlg_logo_256.webp",
        alt: "Reaction Lab Games logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Reaction Lab Games",
    description:
      "Welcome to Reaction Lab Games! Play Rapid Path for free now! Coming soon: Stickman-Skydive-Simulator, Swerve.",
    images: ["/optimized_assets/global_assets/rlg_logo_256.webp"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${universalFont.variable} antialiased bg-brand-background`}
      // LAYOUT_FLAGS_SCRIPT adds layout attributes before hydration.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: LAYOUT_FLAGS_SCRIPT }} />
      </head>
      <body className="min-h-dvh overflow-x-clip font-sans -z-30">
        <UiProvider>
          <AppShell>{children}</AppShell>
        </UiProvider>
      </body>
    </html>
  );
}
