import type { Metadata } from "next";
import HomePageClient from "./home-page-client";

export const metadata: Metadata = {
  title: "Reaction Lab Games",
  description:
    "Welcome to Reaction Lab Games! Play Rapid Path and Stickman Skydive for free now! Coming soon: Swerve.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
