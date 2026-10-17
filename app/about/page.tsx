import type { Metadata } from "next";
import InfoPage from "../info-page";

export const metadata: Metadata = {
    title: "About",
    description: "Learn about Reaction Lab Games and the team building our games.",
    alternates: {
        canonical: "/about",
    },
    openGraph: {
        url: "/about",
    },
};

export default function AboutPage() {
    return (
        <InfoPage title="About RLG">
            <p className="engraved-text">
                Established in 2025, we are a two person game studio dedicated to learning every level of the game development process. So far, we have used Unity as our primary game engine, with tools such as Blender, Photopea, Aesprite, Inkspace, and Gimp to help make our assets.
            </p>
        </InfoPage>
    );
}
