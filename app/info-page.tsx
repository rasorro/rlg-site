import type { ReactNode } from "react";

type InfoPageProps = {
    title: string;
    children: ReactNode;
    // Pill beside the title, styled like the home vats' "Coming Soon" button.
    badge?: string;
    // Glow around the panel, matching the game's vat on the home page.
    glowColor?: string;
};

const BADGE_GLOSS = "linear-gradient(to bottom, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.15) 45%, rgba(255, 255, 255, 0))";

// Shared layout for text pages (About, Contact, coming-soon games): one metal panel, text scaled to the viewport.
export default function InfoPage({ title, children, badge, glowColor }: InfoPageProps) {
    return (
        <main className="relative z-[10] min-h-[calc(100dvh-var(--rlg-nav-h))] shrink-0 bg-brand-background px-[clamp(1rem,4vw,1.5rem)] pb-16 pt-[calc(var(--rlg-nav-row-h)*0.5+1.5rem)] text-brand-text">
            <div
                className="mx-auto max-w-5xl border-3 border-black bg-brand-pipe p-[clamp(1.25rem,4vw,2.5rem)]"
                style={glowColor ? { filter: `drop-shadow(0 0 0.6rem ${glowColor})` } : undefined}
            >
                <div className="flex flex-wrap items-center gap-x-[0.5em] gap-y-[0.3em] text-[clamp(2rem,7vw,3rem)]">
                    <h1 className="engraved-title font-bold leading-tight">{title}</h1>
                    {badge && (
                        <span className="relative inline-flex items-center overflow-hidden rounded-full border-3 border-white/40 bg-brand-background px-[0.8em] py-[0.35em] text-[max(0.4em,0.95rem)] font-bold leading-none ring-2 ring-black">
                            <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-0" style={{ background: BADGE_GLOSS }} />
                            <span className="engraved-title relative z-10">{badge}</span>
                        </span>
                    )}
                </div>
                <div className="mt-4 text-[clamp(1.2rem,4.8vw,2rem)] leading-relaxed">{children}</div>
            </div>
        </main>
    );
}

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="mt-6 rounded-md border border-black/70 bg-black/20 p-[0.6em]">
            <h2 className="engraved-title text-[0.8em] font-bold uppercase tracking-wide">{title}</h2>
            <div className="engraved-text mt-1">{children}</div>
        </section>
    );
}
