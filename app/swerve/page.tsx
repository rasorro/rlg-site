import type { Metadata } from "next";
import InfoPage, { InfoSection } from "../info-page";

export const metadata: Metadata = {
    title: "Swerve",
    description: "Swerve is in development. Check back for release details and gameplay updates.",
    alternates: {
        canonical: "/swerve",
    },
    openGraph: {
        url: "/swerve",
    },
};

export default function SwervePage() {
    return (
        <InfoPage title="Swerve" badge="Coming Soon" glowColor="var(--color-swerve)">
            <p className="engraved-text">
                Create the perfect car to swerve through traffic and unleash your newfound super powers on the world. Bring about honor or carnage... the choice is yours.
            </p>
            <InfoSection title="Platforms">PC (Download), Console</InfoSection>
        </InfoPage>
    );
}
