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

type InstructionsLayout = { top: number; left: number; width: number; height: number };

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
    const playAreaRef = useRef<HTMLDivElement | null>(null);
    const boardRef = useRef<HTMLDivElement | null>(null);
    const [instructionsLayout, setInstructionsLayout] = useState<InstructionsLayout | null>(null);
    const [shouldLoadGame, setShouldLoadGame] = useState(false);
    const [focusMarginRatio, setFocusMarginRatio] = useState(0.05);
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
    // Container units measure the play area, including any space lost to scrollbars.
    // Equal top/bottom clearance keeps the board centered while clearing the navbar's flask.
    // Keep a viewport-based minimum even when touch or monitor reporting is unreliable.
    // A play area with a short side of 480px or less can drop this clearance entirely.
    const responsiveFocusMargin = "clamp(0px, calc((100cqmin - 480px) * 0.25), 5cqmin)";
    const focusMarginPercent = focusMarginRatio * 100;
    const horizontalMargin = showUiPanels
        ? "min(1rem, 3cqw)"
        : `max(${responsiveFocusMargin}, ${focusMarginPercent}cqw)`;
    const verticalMargin = showUiPanels
        ? "min(calc(var(--rlg-nav-row-h) * 0.5 + 1rem), 15cqh)"
        : `max(${responsiveFocusMargin}, ${focusMarginPercent}cqh)`;
    const availableWidth = `calc(100cqw - 2 * ${horizontalMargin})`;
    const availableHeight = `calc(100cqh - 2 * ${verticalMargin})`;

    // With the D-pad on, the game area grows along the long axis: pad beneath the board in portrait
    // (like a Game Boy), beside it in landscape. The game lays itself out inside whatever shape it gets.
    let boardSize: string;
    let gameWidth: string;
    let gameHeight: string;
    if (dPadAspect === null) {
        boardSize = `min(${availableWidth}, ${availableHeight})`;
        gameWidth = boardSize;
        gameHeight = boardSize;
    } else if (isPortrait) {
        boardSize = `min(${availableWidth}, calc(${availableHeight} / ${dPadAspect}))`;
        gameWidth = boardSize;
        gameHeight = `calc(${boardSize} * ${dPadAspect})`;
    } else {
        boardSize = `min(${availableHeight}, calc(${availableWidth} / ${dPadAspect}))`;
        gameWidth = `calc(${boardSize} * ${dPadAspect})`;
        gameHeight = boardSize;
    }
    const boardToggleSize = `clamp(1rem, calc(${boardSize} * 0.0425), 3rem)`;
    const boardToggleInset = `clamp(0.35rem, calc(${boardSize} * 0.013), 0.9rem)`;

    useEffect(() => {
        if (!showControls || !playAreaRef.current || !boardRef.current) return;

        const playArea = playAreaRef.current;
        const board = boardRef.current;
        const observer = new ResizeObserver(() => {
            const areaRect = playArea.getBoundingClientRect();
            const boardRect = board.getBoundingClientRect();
            const gap = 24;
            const left = boardRect.right - areaRect.left + gap;
            const availableSpace = areaRect.width - left - gap;
            // Keep the board's own center fixed; use only the free space to its right.
            const next = availableSpace >= 300 ? {
                top: boardRect.top - areaRect.top,
                left,
                width: availableSpace,
                height: boardRect.height,
            } : null;
            setInstructionsLayout(previous => {
                if (previous?.top === next?.top && previous?.left === next?.left &&
                    previous?.width === next?.width && previous?.height === next?.height) return previous;
                return next;
            });
        });
        observer.observe(playArea);
        observer.observe(board);
        return () => observer.disconnect();
    }, [showControls]);

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
        const syncWindowSize = () => {
            // The parent viewport/DPI can change while the square iframe keeps
            // the same size, so its own resize event is not sufficient.
            gameFrameRef.current?.contentWindow?.postMessage({ type: "RLG_VIEWPORT_CHANGED" }, window.location.origin);
            // Scale clearance with the window's share of its monitor, so maximized
            // windows keep margins even on small screens. Below 75%, use every pixel.
            const widthRatio = (window.outerWidth || window.innerWidth) / Math.max(1, window.screen.availWidth);
            const heightRatio = (window.outerHeight || window.innerHeight) / Math.max(1, window.screen.availHeight);
            const screenRatio = Math.min(widthRatio, heightRatio);
            const marginScale = Math.min(1, Math.max(0, (screenRatio - 0.75) / 0.2));
            setFocusMarginRatio(0.05 * marginScale);
        };

        syncWindowSize();
        document.addEventListener("fullscreenchange", syncWindowSize);
        window.addEventListener("resize", syncWindowSize);
        window.visualViewport?.addEventListener("resize", syncWindowSize);

        return () => {
            document.removeEventListener("fullscreenchange", syncWindowSize);
            window.removeEventListener("resize", syncWindowSize);
            window.visualViewport?.removeEventListener("resize", syncWindowSize);
        };
    }, []);

    const requestGameFocus = useCallback(() => {
        const frame = gameFrameRef.current;
        if (!frame) return;

        frame.focus({ preventScroll: true });
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

    // Expand within the browser so its window stays movable and resizable.
    const toggleFocusMode = () => {
        setShowUiPanels(!showUiPanels);
        window.scrollTo(0, 0);
    };

    return (
        <main className="relative w-full min-w-0 bg-brand-background-dark">
            <div
                ref={playAreaRef}
                className="grid w-full place-items-center"
                style={{
                    containerType: "size",
                    height: showUiPanels ? "max(0px, calc(100dvh - var(--rlg-nav-h)))" : "100dvh",
                }}
            >
                <div ref={boardRef} className="relative">
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
                                className="h-full w-full border-0 focus:outline-none"
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
                        className="absolute z-10 inline-flex items-center justify-center rounded-lg border-2 border-black bg-brand-accent text-brand-text transition-colors hover:bg-brand-glow active:bg-brand-glow data-[pressed=true]:bg-brand-glow"
                        style={{ width: boardToggleSize, height: boardToggleSize, right: boardToggleInset, bottom: boardToggleInset }}
                        onClick={toggleFocusMode}
                        {...touchPressProps("focus")}
                        aria-label={showUiPanels ? "Enter focus mode" : "Exit focus mode"}
                        title={showUiPanels ? "Enter focus mode" : "Exit focus mode"}
                        aria-pressed={!showUiPanels}
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

            </div>
            {showControls && (
                <div
                    className={instructionsLayout ? "absolute" : "mx-auto w-full max-w-[592px] px-4 pb-8"}
                    style={instructionsLayout ?? undefined}
                >
                    <GameInfoPanel
                        sections={infoSections}
                        height={instructionsLayout ? "100%" : "auto"}
                        showControlsDiagram={!isTouchOnly}
                        adaptiveText={instructionsLayout !== null}
                        compact
                        inline
                        className="!mt-0 max-w-none"
                    />
                </div>
            )}
        </main>
    );
}
