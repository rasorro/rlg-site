"use client";

import { TransitionLink } from "./page-transition";
import { useUi } from "./ui-context";

export default function Navbar() {
    const { showUiPanels } = useUi();

    if (!showUiPanels) return null;

    const navButtonClass =
        "relative inline-flex items-center overflow-hidden rounded-xl border-3 border-white/40 ring-2 ring-black bg-brand-orange px-[0.7em] py-[0.3em] leading-none text-brand-pink";

    const navMetalStyle = {
        backgroundImage: [
            "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.12) 22%, rgba(0, 0, 0, 0.2) 62%, rgba(255, 255, 255, 0.08) 100%)",
            "radial-gradient(120% 80% at 50% -30%, rgba(255, 255, 255, 0.36) 0%, rgba(255, 255, 255, 0) 62%)",
            "linear-gradient(to right, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 12%, rgba(255, 255, 255, 0.06) 24%, rgba(255, 255, 255, 0) 36%, rgba(255, 255, 255, 0.05) 48%, rgba(255, 255, 255, 0) 60%, rgba(255, 255, 255, 0.05) 72%, rgba(255, 255, 255, 0) 84%, rgba(255, 255, 255, 0.06) 100%)",
            "url('rlg_Navbar_alt.webp')",
        ].join(", "),
        backgroundSize: "500% 500%, 500% 500%, 500% 500%, auto 500%",
        backgroundPosition: "center, center, center, center",
        backgroundRepeat: "no-repeat, no-repeat, no-repeat, repeat-x",
        backgroundBlendMode: "screen, soft-light, overlay, normal",
    } as const;

    return (
        <nav
            className="relative z-10 h-[var(--rlg-nav-h)] shrink-0 border-b-3 border-black bg-brand-pipe px-[var(--rlg-nav-pad-x)]"
            style={navMetalStyle}
        >
            <div className="flex h-full items-center gap-[var(--rlg-nav-gap)] font-bold" style={{ fontSize: "calc(var(--rlg-nav-h) * 0.45)" }}>
                <div aria-label="Reaction Lab Games" className="leading-none bg-brand-pink px-[0.5em] py-[0.2em] border-3 border-black text-center translate-x-[0.5em]">
                    <span className="engraved-title relative top-[0.1em] max-[750px]:inline min-[1001px]:hidden">RLG</span>
                    <span className="engraved-title relative top-[0.1em] hidden min-[751px]:inline">REACTION LAB GAMES</span>
                </div>

                <div className="ml-auto flex items-center gap-[var(--rlg-nav-gap)] text-[0.7em] translate-x-[-0.5em]">
                    <TransitionLink href="/about" className={navButtonClass} aria-label="Go to About page">
                        <span aria-hidden="true" className="pointer-events-none absolute inset-[0px] z-20 rounded-[10px] bg-white opacity-[0.15]" />
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 z-0"
                            style={{ background: "linear-gradient(to bottom, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.15) 45%, rgba(255, 255, 255, 0))" }}
                        />
                        <span className="engraved-title relative z-10">ABOUT</span>
                    </TransitionLink>

                    <TransitionLink href="/contact" className={navButtonClass} aria-label="Go to Contact page">
                        <span aria-hidden="true" className="pointer-events-none absolute inset-[0px] z-20 rounded-[10px] bg-white opacity-[0.15]" />
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 z-0"
                            style={{ background: "linear-gradient(to bottom, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.15) 45%, rgba(255, 255, 255, 0))" }}
                        />
                        <span className="engraved-title relative z-10">CONTACT</span>
                    </TransitionLink>
                </div>
            </div>
            <TransitionLink
                href="/"
                aria-label="Go to home"
                className="absolute left-1/2 top-full inline-flex h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full p-0 shrink-0"
            >
                <svg
                    viewBox="0 0 100 100"
                    className="absolute inset-0 h-full w-full"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="var(--color-brand-pink)"
                    aria-hidden="true"
                >
                </svg>
            </TransitionLink>
        </nav>
    );
}
