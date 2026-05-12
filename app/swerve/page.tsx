import Link from "next/link";

export default function SwervePage() {
    return (
        <main className="min-h-dvh bg-zinc-900 px-6 py-12 text-zinc-100">
            <div className="mx-auto max-w-2xl">
                <Link href="/" className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">
                    ← Back
                </Link>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                    <h1 className="text-4xl font-bold">Swerve</h1>
                    <span className="shrink-0 rounded-full bg-zinc-700 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                        Coming Soon
                    </span>
                </div>

                <p className="mt-6 text-lg leading-relaxed text-zinc-300">
                    Create the perfect car to swerve through traffic and unleash your newfound super powers on the world. Bring about honor or carnage... the choice is yours.
                </p>

                <div className="mt-8 border-t border-white/10 pt-8">
                    <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Platforms</p>
                    <p className="mt-2 text-zinc-300">PC (Download), Console</p>
                </div>
            </div>
        </main>
    );
}
