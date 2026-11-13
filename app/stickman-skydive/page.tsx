import type { Metadata } from "next";
import StickmanSkydiveClientPage from "./stickman-client";

const title = "Stickman Skydive";
const description = "Play Stickman Skydive in your browser: dive, pull tricks, collect rings and land safely to earn money for gear upgrades.";
const images = [{
    url: "/optimized_assets/game_assets/stickman-skydive-simulator/stickmanSkydivePreview.webp",
    alt: title,
}];

export const metadata: Metadata = {
    title,
    description,
    alternates: {
        canonical: "/stickman-skydive/",
    },
    openGraph: {
        title: `${title} | Reaction Lab Games`,
        description,
        url: "/stickman-skydive/",
        siteName: "Reaction Lab Games",
        type: "website",
        images,
    },
    twitter: {
        card: "summary_large_image",
        title: `${title} | Reaction Lab Games`,
        description,
        images,
    },
};

export default function StickmanSkydivePage() {
    return <StickmanSkydiveClientPage />;
}
