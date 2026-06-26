"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameInfoPanel, { type InfoSection } from "../game-info-panel";
import { usePageTransition } from "../page-transition";
import { useUi } from "../ui-context";

const INFO_SECTIONS: InfoSection[] = [
    {
        title: "Controls",
        text: "",
    },
    {
        title: "Goal",
        text: "Connect every highlighted dot in one continuous path.",
    },
    {
        title: "Game Modes",
        items: ["No Path: find the path yourself", "Show Path: speed through set path"],
    },
    {
        title: "Rules",
        items: [
            "+3 seconds for each completed path.",
            "No backtracking.",
            "Don't touch black dots.",
        ],
    },
    {
        title: "Menu",
        text: "Pause to submit score, view leaderboard, restart, change theme, mute audio, or switch modes.",
    },
];

export default function RapidPathPage() {
    const { showUiPanels, setShowUiPanels } = useUi();
    const { isTransitioning } = usePageTransition();
    const gameFrameRef = useRef<HTMLIFrameElement | null>(null);
    const [shouldLoadGame, setShouldLoadGame] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const focusModeSize = isFullscreen ? "min(90dvw, 90dvh)" : "min(100dvw, 100dvh)";

    const boardSize = showUiPanels
        ? "min(calc(90dvw - 2rem), calc(90dvh - 7rem), 760px)"
        : focusModeSize;
    const pageHeightClass = showUiPanels ? "min-h-[calc(100dvh-var(--rlg-nav-h))]" : "min-h-dvh";
    const boardToggleSize = `clamp(1rem, calc(${boardSize} * 0.0425), 3rem)`;
    const boardToggleInset = `clamp(0.35rem, calc(${boardSize} * 0.013), 0.9rem)`;

    useEffect(() => {
        if (shouldLoadGame || isTransitioning) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setShouldLoadGame(true);
        }, 120);

        return () => window.clearTimeout(timeoutId);
    }, [isTransitioning, shouldLoadGame]);

    useEffect(() => {
        const syncFullscreenState = () => {
            const tolerancePx = 24;
            const viewportW = window.visualViewport?.width ?? window.innerWidth;
            const viewportH = window.visualViewport?.height ?? window.innerHeight;
            const isBrowserFullscreenByViewport =
                Math.abs(viewportW - window.screen.width) <= tolerancePx &&
                Math.abs(viewportH - window.screen.height) <= tolerancePx;
            const isScreenFillingWindow =
                window.outerWidth >= window.screen.availWidth - tolerancePx &&
                window.outerHeight >= window.screen.availHeight - tolerancePx;

            setIsFullscreen(Boolean(document.fullscreenElement) || isBrowserFullscreenByViewport || isScreenFillingWindow);
        };

        syncFullscreenState();
        document.addEventListener("fullscreenchange", syncFullscreenState);
        window.addEventListener("resize", syncFullscreenState);
        window.visualViewport?.addEventListener("resize", syncFullscreenState);

        return () => {
            document.removeEventListener("fullscreenchange", syncFullscreenState);
            window.removeEventListener("resize", syncFullscreenState);
            window.visualViewport?.removeEventListener("resize", syncFullscreenState);
        };
    }, []);

    const requestGameFocus = useCallback(() => {
        const frame = gameFrameRef.current;
        if (!frame) return;

        frame.focus();
        try {
            frame.contentWindow?.postMessage({ type: "RLG_FOCUS_GAME" }, window.location.origin);
            frame.contentWindow?.focus();
        } catch {
            // Ignore cross-frame focus errors in restrictive environments.
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            requestGameFocus();
        }, 75);

        return () => window.clearTimeout(timeoutId);
    }, [showUiPanels, requestGameFocus]);

    return (
        <main className={`relative flex flex-col ${pageHeightClass} w-full items-center overflow-y-auto bg-brand-background`}>
            <div className={showUiPanels ? "flex flex-col items-center gap-8 pt-[calc(var(--rlg-nav-h)-1rem)] pb-0" : "flex flex-col items-center gap-0 my-auto"}>
                <div className={showUiPanels ? "relative flex flex-col items-center gap-4" : "relative flex flex-col items-center gap-0"}>
                    {/* {showUiPanels && (
                        <h1 className="absolute bottom-full left-1/2 z-10 mb-4 -translate-x-1/2 whitespace-nowrap text-5xl font-bold text-zinc-100">Rapid Path</h1>
                    )} */}

                    <div className={showUiPanels ? "relative" : "relative"}>
                        <div
                            className="aspect-square box-border shrink-0 overflow-hidden ring ring-inset ring-black bg-brand-orange"
                            style={{ width: boardSize }}
                        >
                            <iframe
                                ref={gameFrameRef}
                                src={shouldLoadGame ? "/games/rapid-path/game.html" : "about:blank"}
                                title="Reaction Lab Unity WebGL"
                                className="h-full w-full border-0"
                                allow="fullscreen; autoplay; gamepad"
                                loading="eager"
                                onLoad={requestGameFocus}
                            />
                        </div>

                        <button
                            type="button"
                            className="absolute z-10 inline-flex items-center justify-center rounded-lg border-2 border-black bg-brand-pipe text-brand-glow backdrop-blur transition hover:bg-brand-orange"
                            style={{ width: boardToggleSize, height: boardToggleSize, right: boardToggleInset, bottom: boardToggleInset }}
                            onClick={() => setShowUiPanels(!showUiPanels)}
                            aria-label={showUiPanels ? "Enter focus mode" : "Exit focus mode"}
                            title={showUiPanels ? "Enter focus mode" : "Exit focus mode"}
                        >
                            {showUiPanels ? (
                                <svg viewBox="0 0 24 24" className="h-[70%] w-[70%]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M9 4H4v5" />
                                    <path d="m4 4 6 6" />
                                    <path d="M15 4h5v5" />
                                    <path d="m20 4-6 6" />
                                    <path d="M9 20H4v-5" />
                                    <path d="m4 20 6-6" />
                                    <path d="M15 20h5v-5" />
                                    <path d="m20 20-6-6" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" className="h-[70%] w-[70%]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M9 4H4v5" />
                                    <path d="m4 4 6 6" />
                                    <path d="M15 4h5v5" />
                                    <path d="m20 4-6 6" />
                                    <path d="M9 20H4v-5" />
                                    <path d="m4 20 6-6" />
                                    <path d="M15 20h5v-5" />
                                    <path d="m20 20-6-6" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {showUiPanels && <GameInfoPanel sections={INFO_SECTIONS} height={boardSize} showControlsDiagram />}
                </div>
            </div>
        </main>
    );
}
