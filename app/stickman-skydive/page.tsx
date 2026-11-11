import type { Metadata } from "next";
import StickmanSkydiveClientPage from "./stickman-client";

export const metadata: Metadata = {
    title: "Stickman Skydive Simulator",
    description: "Play Stickman Skydive Simulator in your browser: dive, pull tricks, collect rings and land safely to earn money for gear upgrades.",
    alternates: {
        canonical: "/stickman-skydive/",
    },
    openGraph: {
        url: "/stickman-skydive/",
    },
};

export default function StickmanSkydiveSimulatorPage() {
    return <StickmanSkydiveClientPage />;
}
