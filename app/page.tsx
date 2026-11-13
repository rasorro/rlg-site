import type { Metadata } from "next";
import { preload } from "react-dom";
import HomePageClient from "./home-page-client";
import { HOME_BACKGROUND_SRC } from "./home-layout";

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
  // Start fetching the background photo with the HTML instead of when the CSS is first applied.
  preload(HOME_BACKGROUND_SRC, { as: "image" });
  return <HomePageClient />;
}
