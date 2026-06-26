import type { Metadata } from "next";
import { Coiny } from "next/font/google";
import "./globals.css";
import AppShell from "./app-shell";
import { UiProvider } from "./ui-context";

const universalFont = Coiny({
  weight: "400",
  variable: "--font-bagel-fat-one",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://reactionlabgames.com"),
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
        url: "/assets/rlg_Logo.png",
        alt: "Reaction Lab Games logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Reaction Lab Games",
    description:
      "Welcome to Reaction Lab Games! Play Rapid Path for free now! Coming soon: Stickman-Skydive-Simulator, Swerve.",
    images: ["/assets/rlg_Logo.png"],
  },
  icons: {
    icon: "/assets/favicon.ico",
    shortcut: "/assets/favicon.ico",
    apple: "/assets/rlg_Logo.png",
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
      className={`${universalFont.variable} h-full antialiased bg-brand-background overflow-hidden`}
    >
      <body className="h-full overflow-hidden font-sans -z-30">
        <UiProvider>
          <AppShell>{children}</AppShell>
        </UiProvider>
      </body>
    </html>
  );
}
