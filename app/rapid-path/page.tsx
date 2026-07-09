import type { Metadata } from "next";
import RapidPathClientPage from "./rapid-path-client";

export const metadata: Metadata = {
    title: "Rapid Path",
    description: "Play Rapid Path in your browser and race to connect every highlighted dot before time runs out.",
    alternates: {
        canonical: "/rapid-path/",
    },
    openGraph: {
        url: "/rapid-path/",
    },
};

export default function RapidPathPage() {
    return <RapidPathClientPage />;
}
