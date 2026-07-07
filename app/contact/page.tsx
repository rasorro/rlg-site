import type { Metadata } from "next";
import { TransitionLink } from "../page-transition";

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
        <main className="relative z-[10] min-h-[calc(100dvh-var(--rlg-nav-h))] bg-brand-background px-6 py-16 text-brand-glow">
            <div className="mx-auto max-w-5xl border-3 border-black bg-brand-pipe p-6 sm:p-10">
                <h1 className="engraved-title text-[3rem] font-bold">Contact</h1>
                <ul className="mt-4 space-y-3 text-[2rem] leading-relaxed text-brand-text">
                    <li className="engraved-text">
                        Email:{" "}
                        <a href="mailto:reactionlabgames@gmail.com" className="text-brand-accent underline">
                            reactionlabgames@gmail.com
                        </a>
                    </li>
                    <li className="engraved-text">
                        Instagram:{" "}
                        <a
                            href="https://www.instagram.com/reactionlabgames"
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-accent underline"
                        >
                            @reactionlabgames
                        </a>
                    </li>
                </ul>
                
            </div>
        </main>
    );
}
