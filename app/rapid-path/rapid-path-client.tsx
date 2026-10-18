"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import GameInfoPanel, { type InfoSection } from "../game-info-panel";
import { useHasFinePointer } from "../input-capabilities";
import { usePageTransition } from "../page-transition";
import { useTouchPress } from "../touch-press";
import { useUi } from "../ui-context";
import DesktopOnlyPanel from "./desktop-only-panel";

const RAPID_PATH_BUILD_VERSION = "1.0.4";

// Keyboard devices get the WASD/arrows diagram; touch-only devices (after opting in) get swipe instructions instead.
const KEYBOARD_CONTROLS: InfoSection = { title: "Controls", text: "" };
const TOUCH_CONTROLS: InfoSection = { title: "Controls", text: "Swipe the board to move." };

const OTHER_INFO_SECTIONS: InfoSection[] = [
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

const PORTRAIT_QUERY = "(orientation: portrait)";

function subscribeToOrientation(onChange: () => void) {
    const mediaQuery = window.matchMedia(PORTRAIT_QUERY);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
}

// Defaults to portrait before hydration; only consulted once the game reports its D-pad is on.
function useIsPortrait(): boolean {
    return useSyncExternalStore(
        subscribeToOrientation,
        () => window.matchMedia(PORTRAIT_QUERY).matches,
        () => true,
    );
}

export default function RapidPathClientPage() {
    const { showUiPanels, setShowUiPanels } = useUi();
    const { isTransitioning } = usePageTransition();
    const gameFrameRef = useRef<HTMLIFrameElement | null>(null);
    const [shouldLoadGame, setShouldLoadGame] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isGameReady, setIsGameReady] = useState(false);
    const [gameLoadError, setGameLoadError] = useState(false);
    const [loadAnyway, setLoadAnyway] = useState(false);
    // Long side : short side the game asks for while its on-screen D-pad is shown; null when it's off.
    const [dPadAspect, setDPadAspect] = useState<number | null>(null);
    const isPortrait = useIsPortrait();

    // Touch-only devices see the desktop panel instead of the game until they opt in; null means not yet hydrated.
    const hasFinePointer = useHasFinePointer();
    const touchPressProps = useTouchPress();
    const canLoadGame = hasFinePointer === true || loadAnyway;
    const showDesktopOnlyPanel = hasFinePointer === false && !loadAnyway;
    const showControls = showUiPanels && canLoadGame;
    const isTouchOnly = hasFinePointer === false;
    const infoSections = [isTouchOnly ? TOUCH_CONTROLS : KEYBOARD_CONTROLS, ...OTHER_INFO_SECTIONS];
    // Desktop fullscreen keeps a margin around the board; touch devices use the whole screen.
    const fullscreenMargin = isFullscreen && !isTouchOnly;
    const focusModeSize = fullscreenMargin ? "min(90dvw, 90dvh)" : "min(100dvw, 100dvh)";

    // Top padding clears the half of the flask hanging below the navbar; the board fills what's left of the viewport.
    // Touch landscape is too short for that, so the game takes the full screen height and the header scrolls away above it.
    const boardTopPad = "calc(var(--rlg-nav-row-h) * 0.5 + 2rem)";
    const isTouchLandscape = isTouchOnly && !isPortrait;
    const availableWidth = showUiPanels ? "calc(90dvw - 2rem)" : fullscreenMargin ? "90dvw" : "100dvw";
    const availableHeight = showUiPanels
        ? isTouchLandscape ? "calc(100dvh - 1rem)" : `calc(100dvh - var(--rlg-nav-h) - ${boardTopPad} - 1.5rem)`
        : fullscreenMargin ? "90dvh" : "100dvh";
    const boardCap = showUiPanels ? ", 760px" : "";

    // With the D-pad on, the game area grows along the long axis: pad beneath the board in portrait
    // (like a Game Boy), beside it in landscape. The game lays itself out inside whatever shape it gets.
    let boardSize: string;
    let gameWidth: string;
    let gameHeight: string;
    if (dPadAspect === null) {
        boardSize = showUiPanels ? `min(${availableWidth}, ${availableHeight}${boardCap})` : focusModeSize;
        gameWidth = boardSize;
        gameHeight = boardSize;
    } else if (isPortrait) {
        boardSize = `min(${availableWidth}, calc(${availableHeight} / ${dPadAspect})${boardCap})`;
        gameWidth = boardSize;
        gameHeight = `calc(${boardSize} * ${dPadAspect})`;
    } else {
        boardSize = `min(${availableHeight}, calc(${availableWidth} / ${dPadAspect})${boardCap})`;
        gameWidth = `calc(${boardSize} * ${dPadAspect})`;
        gameHeight = boardSize;
    }
    // iPhone has no fullscreen API for pages, but Safari collapses its bars when the page scrolls. Touch landscape focus mode
    // (where the bars cost the board height) adds scroll room above the board and pins the board to the bottom, so scrolling
    // down hides the bars and ends with the board filling the screen. Portrait has height to spare and stays centered.
    const focusPageHeightClass = isTouchLandscape ? "min-h-[calc(100lvh+3rem)]" : "min-h-dvh";
    const focusContentClass = isTouchLandscape ? "mt-auto" : "my-auto";
    const pageHeightClass = showUiPanels ? "min-h-[calc(100dvh-var(--rlg-nav-h))]" : focusPageHeightClass;
    const boardToggleSize = `clamp(1rem, calc(${boardSize} * 0.0425), 3rem)`;
    const boardToggleInset = `clamp(0.35rem, calc(${boardSize} * 0.013), 0.9rem)`;

    useEffect(() => {
        if (shouldLoadGame || isTransitioning || !canLoadGame) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setShouldLoadGame(true);
        }, 120);

        return () => window.clearTimeout(timeoutId);
    }, [canLoadGame, isTransitioning, shouldLoadGame]);

    useEffect(() => {
        const handleGameMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) {
                return;
            }

            if (event.data?.type === "RLG_GAME_READY") {
                setIsGameReady(true);
                setGameLoadError(false);
            } else if (event.data?.type === "RLG_GAME_ERROR") {
                setGameLoadError(true);
            } else if (event.data?.type === "RLG_DPAD_CHANGED") {
                const aspect = Number(event.data.aspect);
                setDPadAspect(event.data.enabled && aspect >= 1 ? aspect : null);
            }
        };

        window.addEventListener("message", handleGameMessage);
        return () => window.removeEventListener("message", handleGameMessage);
    }, []);

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

    // Focus mode also asks for real browser fullscreen, hiding the tab strip and URL bar where the browser allows it
    // (not on iPhone Safari, which only fullscreens video). Leaving fullscreen any other way (Esc, back gesture) exits focus mode too.
    const enteredFullscreenRef = useRef(false);

    const toggleFocusMode = () => {
        const root = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
        const doc = document as Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void };
        const enteringFocus = showUiPanels;
        setShowUiPanels(!enteringFocus);
        // Start at the top so there's room to scroll down to the board, which is what collapses the browser bars
        if (enteringFocus && isTouchLandscape) window.scrollTo(0, 0);

        if (enteringFocus) {
            if (root.requestFullscreen) {
                root.requestFullscreen({ navigationUI: "hide" })
                    .then(() => { enteredFullscreenRef.current = true; })
                    .catch(() => {});
            } else if (root.webkitRequestFullscreen) {
                root.webkitRequestFullscreen();
                enteredFullscreenRef.current = true;
            }
        } else if (enteredFullscreenRef.current) {
            enteredFullscreenRef.current = false;
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            else if (doc.webkitFullscreenElement) doc.webkitExitFullscreen?.();
        }
    };

    useEffect(() => {
        const handleFullscreenExit = () => {
            const doc = document as Document & { webkitFullscreenElement?: Element | null };
            if (!enteredFullscreenRef.current || document.fullscreenElement || doc.webkitFullscreenElement) return;
            enteredFullscreenRef.current = false;
            setShowUiPanels(true);
        };

        document.addEventListener("fullscreenchange", handleFullscreenExit);
        document.addEventListener("webkitfullscreenchange", handleFullscreenExit);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenExit);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenExit);
        };
    }, [setShowUiPanels]);

    return (
        <main className={`relative flex flex-col ${pageHeightClass} w-full items-center overflow-y-auto bg-brand-background-dark`}>
            <div
                className={showUiPanels ? "flex flex-col items-center gap-8 pb-0" : `flex flex-col items-center gap-0 ${focusContentClass}`}
                style={showUiPanels ? { paddingTop: boardTopPad } : undefined}
            >
                <div className={showUiPanels ? "relative flex flex-col items-center gap-4 xl:flex-row xl:gap-6" : "relative flex flex-col items-center gap-0"}>
                    {/* {showUiPanels && (
                        <h1 className="absolute bottom-full left-1/2 z-10 mb-4 -translate-x-1/2 whitespace-nowrap text-5xl font-bold text-zinc-100">Rapid Path</h1>
                    )} */}

                    <div className={showUiPanels ? "relative" : "relative"}>
                        <div
                            className="box-border shrink-0 overflow-hidden ring ring-inset ring-black bg-brand-background"
                            style={{ width: gameWidth, height: gameHeight }}
                        >
                            <>
                                {showDesktopOnlyPanel && <DesktopOnlyPanel boardSize={boardSize} onLoadAnyway={() => setLoadAnyway(true)} />}
                                {!showDesktopOnlyPanel && !isGameReady && (!shouldLoadGame || gameLoadError) && (
                                    <div
                                        className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-brand-background"
                                        aria-live="polite"
                                    >
                                        {gameLoadError ? (
                                            <span className="px-6 text-center text-2xl font-bold uppercase tracking-wide text-brand-text">
                                                The game could not be loaded. Please refresh the page and try again.
                                            </span>
                                        ) : (
                                            <div className="flex flex-col items-center gap-4 text-brand-text">
                                                <Image
                                                    src="/optimized_assets/global_assets/rlg_logo_256.webp"
                                                    alt="Reaction Lab Games"
                                                    width={96}
                                                    height={96}
                                                    className="h-24 w-24 object-contain"
                                                    priority
                                                />
                                                <span className="text-center text-xl font-bold uppercase tracking-wide">
                                                    Loading Rapid Path...
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <iframe
                                    ref={gameFrameRef}
                                    src={shouldLoadGame
                                        ? `/optimized_assets/game_assets/rapid-path/game.html?v=${RAPID_PATH_BUILD_VERSION}&build=Build/RapidPath-${RAPID_PATH_BUILD_VERSION}/Build&file=RapidPath-${RAPID_PATH_BUILD_VERSION}`
                                        : "about:blank"}
                                    title="Reaction Lab Unity WebGL"
                                    className="h-full w-full border-0"
                                    allow="fullscreen; autoplay; gamepad"
                                    loading="eager"
                                    onLoad={() => {
                                        setIsGameReady(false);
                                        requestGameFocus();
                                    }}
                                />
                            </>
                        </div>

                        {canLoadGame && <button
                            type="button"
                            className="absolute z-10 inline-flex items-center justify-center rounded-lg border-2 border-black bg-brand-accent text-brand-text backdrop-blur transition hover:bg-brand-glow active:bg-brand-glow data-[pressed=true]:bg-brand-glow"
                            style={{ width: boardToggleSize, height: boardToggleSize, right: boardToggleInset, bottom: boardToggleInset }}
                            onClick={toggleFocusMode}
                            {...touchPressProps("focus")}
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
                        </button>}
                    </div>

                    {showControls && (
                        <GameInfoPanel
                            sections={infoSections}
                            height={gameHeight}
                            showControlsDiagram={!isTouchOnly}
                            compact
                            fitContent
                            inline
                            className="max-w-[560px] xl:w-[560px] xl:max-w-none"
                        />
                    )}
                </div>
            </div>
        </main>
    );
}
