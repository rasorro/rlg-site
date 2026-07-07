import type { Metadata } from "next";
import { TransitionLink } from "../page-transition";

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
        <main className="min-h-dvh bg-zinc-900 px-6 py-12 text-zinc-100">
            <div className="mx-auto max-w-2xl">
                <TransitionLink href="/" className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">
                    ← Back
                </TransitionLink>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                    <h1 className="text-4xl font-bold">Stickman Skydive Simulator</h1>
                    <span className="shrink-0 rounded-full bg-zinc-700 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                        Coming Soon
                    </span>
                </div>

                <p className="mt-6 text-lg leading-relaxed text-zinc-300">
                    Soar through the sky and earn money to upgrade your gear so you can soar through the sky and earn money to upgrade your gear.
                </p>

                <div className="mt-8 border-t border-white/10 pt-8">
                    <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Platforms</p>
                    <p className="mt-2 text-zinc-300">Browser</p>
                </div>
            </div>
        </main>
    );
}
