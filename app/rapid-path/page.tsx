"use client";

import { useUi } from "../ui-context";

type InfoSection = {
    title: string;
    text?: string;
    items?: string[];
};

const INFO_SECTIONS: InfoSection[] = [
    {
        title: "Controls",
        text: "WASD or Arrow Keys",
    },
    {
        title: "Goal",
        text: "Create a path that connects all the given dots.",
    },
    {
        title: "Game Modes",
        items: ["No Path", "Show Path"],
    },
    {
        title: "Rules",
        items: [
            "Gain 3 seconds for each completed path.",
            "Cannot go backwards.",
            "Cannot go on black dots.",
        ],
    },
    {
        title: "Menu",
        text: "Pause to submit high score, view leaderboard, restart, change theme, mute sounds, or change to show path mode.",
    },
];

function SectionText({ text }: { text: string }) {
    return <p className="mt-2 whitespace-normal text-xl text-zinc-300">{text}</p>;
}

function SectionList({ items }: { items: string[] }) {
    return (
        <ul className="mt-2 list-disc pl-6 text-xl text-zinc-300">
            {items.map((item) => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    );
}

export default function RapidPathPage() {
    const { showUiPanels, setShowUiPanels } = useUi();
    const boardSize = showUiPanels
        ? "min(calc(100dvw - 2rem), calc(100dvh - 7rem), 760px)"
        : "min(100dvw, 100dvh, 760px)";

    return (
        <main className={showUiPanels
            ? "relative flex min-h-[calc(100dvh-3.5rem)] w-full items-start justify-center bg-zinc-900 p-4 xl:items-center"
            : "relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-zinc-900 p-0"}>
            <div className={showUiPanels ? "flex flex-col items-center gap-8" : "flex flex-col items-center gap-0"}>
                <div className={showUiPanels ? "relative mt-16 flex flex-col items-center gap-4 xl:mt-0" : "relative flex flex-col items-center gap-0"}>
                    {showUiPanels && (
                        <h1 className="absolute bottom-full left-1/2 z-10 mb-4 -translate-x-1/2 whitespace-nowrap text-5xl font-bold text-zinc-100">Rapid Path</h1>
                    )}

                    <div className="relative">
                        <div
                            className="aspect-square shrink-0 overflow-hidden border border-white/10 bg-black"
                            style={{ width: boardSize }}
                        >
                            <iframe
                                src="/game.html"
                                title="Reaction Lab Unity WebGL"
                                className="h-full w-full border-0"
                                allow="fullscreen; autoplay; gamepad"
                                loading="eager"
                            />
                        </div>

                        <button
                            className="absolute left-1/2 top-full z-10 -translate-x-1/2 translate-y-3 rounded bg-white/10 px-3 py-1 text-lg text-zinc-100 transition hover:bg-white/20"
                            onClick={() => setShowUiPanels(!showUiPanels)}
                        >
                            {showUiPanels ? "FOCUS" : "HELP"}
                        </button>
                    </div>

                    {showUiPanels && (
                        <aside className="mt-12 w-full max-w-[400px] text-zinc-100 xl:mt-0 xl:absolute xl:left-[calc(100%+1.5rem)] xl:top-1/2 xl:w-[280px] xl:max-w-none xl:-translate-y-1/2">
                            {INFO_SECTIONS.map((section, index) => (
                                <div key={section.title}>
                                    <h2 className={index === 0 ? "whitespace-nowrap text-2xl font-bold" : "mt-6 whitespace-nowrap text-2xl font-bold"}>
                                        {section.title}
                                    </h2>
                                    {section.text && <SectionText text={section.text} />}
                                    {section.items && <SectionList items={section.items} />}
                                </div>
                            ))}
                        </aside>
                    )}
                </div>
            </div>
        </main>
    );
}
