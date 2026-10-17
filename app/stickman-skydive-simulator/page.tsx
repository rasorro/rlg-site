import type { Metadata } from "next";
import InfoPage, { InfoSection } from "../info-page";

export const metadata: Metadata = {
    title: "Stickman Skydive Simulator",
    description: "Stickman Skydive Simulator is in development. Follow progress and upcoming release updates.",
    alternates: {
        canonical: "/stickman-skydive-simulator",
    },
    openGraph: {
        url: "/stickman-skydive-simulator",
    },
};

export default function StickmanSkydiveSimulatorPage() {
    return (
        <InfoPage title="Stickman Skydive Simulator" badge="Coming Soon" glowColor="var(--color-stickman)">
            <p className="engraved-text">
                Soar through the sky and earn money to upgrade your gear so you can soar through the sky and earn money to upgrade your gear.
            </p>
            <InfoSection title="Platforms">Browser</InfoSection>
        </InfoPage>
    );
}
