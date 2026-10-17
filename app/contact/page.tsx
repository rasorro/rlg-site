import type { Metadata } from "next";
import InfoPage from "../info-page";

export const metadata: Metadata = {
    title: "Contact",
    description: "Contact Reaction Lab Games by email or Instagram.",
    alternates: {
        canonical: "/contact",
    },
    openGraph: {
        url: "/contact",
    },
};

export default function ContactPage() {
    return (
        <InfoPage title="Contact">
            <ul className="space-y-3">
                <li className="engraved-text">
                    Email:{" "}
                    <a href="mailto:reactionlabgames@gmail.com" className="text-brand-accent underline [overflow-wrap:anywhere]">
                        reactionlabgames@gmail.com
                    </a>
                </li>
                <li className="engraved-text">
                    Instagram:{" "}
                    <a
                        href="https://www.instagram.com/reactionlabgames"
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-accent underline [overflow-wrap:anywhere]"
                    >
                        @reactionlabgames
                    </a>
                </li>
            </ul>
        </InfoPage>
    );
}
