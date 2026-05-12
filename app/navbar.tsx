"use client";

import Link from "next/link";
import { useUi } from "./ui-context";

export default function Navbar() {
    const { showUiPanels } = useUi();

    if (!showUiPanels) return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex h-18 items-center border-b border-white/10 bg-zinc-900 px-6">
            <Link
                href="/"
                aria-label="Go to home"
                className="mr-3 inline-flex h-17.5 w-17.5 items-center justify-center rounded-md p-1"
            >
                <img src="/ReactionLabLogo.png" alt="Reaction Lab Logo" className="h-full w-full object-contain" />
            </Link>
            <span className="text-xl font-bold text-zinc-100">Reaction Lab Games</span>
        </nav>
    );
}
