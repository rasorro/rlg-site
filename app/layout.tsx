import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "./app-shell";
import { UiProvider } from "./ui-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
        url: "/ReactionLabLogo.png",
        alt: "Reaction Lab Games logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Reaction Lab Games",
    description:
      "Welcome to Reaction Lab Games! Play Rapid Path for free now! Coming soon: Stickman-Skydive-Simulator, Swerve.",
    images: ["/ReactionLabLogo.png"],
  },
  icons: {
    icon: "/ReactionLabLogo.png",
    shortcut: "/ReactionLabLogo.png",
    apple: "/ReactionLabLogo.png",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <UiProvider>
          <AppShell>{children}</AppShell>
        </UiProvider>
      </body>
    </html>
  );
}
