"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import DesktopOnlyPanel from "../desktop-only-panel";
import GameInfoPanel, { type InfoSection } from "../game-info-panel";
import { useHasFinePointer } from "../input-capabilities";
import { usePageTransition } from "../page-transition";
import { useTouchPress } from "../touch-press";
import { useUi } from "../ui-context";

const STICKMAN_BUILD_VERSION = "1.0.0";
// Bump when re-uploading a build under the same version, so the long-cached files are fetched again.
const STICKMAN_BUILD_REVISION = "6";

// The game is always 16:9; the board is the biggest 16:9 rectangle that fits the play area.
const ASPECT_WIDTH = 16;
const ASPECT_HEIGHT = 9;

function Keycap({ children }: { children: ReactNode }) {
    return (
        <span className="inline-flex h-[1.6em] min-w-[1.6em] items-center justify-center rounded-md border border-black/80 bg-black/35 px-[0.4em] text-[1em] font-black leading-none tracking-wide text-brand-glow">
            {children}
        </span>
    );
}

function KeyRow({ keys, children }: { keys: ReactNode; children: ReactNode }) {
    return (
        <div className="flex items-center gap-[0.6em]">
            <div className="flex w-[8.5em] shrink-0 flex-wrap items-center gap-[0.25em]">{keys}</div>
            <span className="engraved-text leading-tight">{children}</span>
        </div>
    );
}

// Shown under the WASD / arrows diagram: what each key does.
const CONTROLS_LEGEND = (
    <div className="mt-2 flex flex-col gap-[0.4em]">
        <KeyRow keys={<><Keycap>A</Keycap><Keycap>D</Keycap><span className="engraved-text px-[0.1em]">or</span><Keycap>←</Keycap><Keycap>→</Keycap></>}>
            Steer left and right
        </KeyRow>
        <KeyRow keys={<><Keycap>W</Keycap><Keycap>S</Keycap><span className="engraved-text px-[0.1em]">or</span><Keycap>↑</Keycap><Keycap>↓</Keycap></>}>
            Tilt your body
        </KeyRow>
        <KeyRow keys={<Keycap>Space</Keycap>}>Jump from the plane, then open your chute</KeyRow>
        <KeyRow keys={<Keycap>Shift</Keycap>}>Hold to tighten your limbs and fall faster</KeyRow>
        <KeyRow keys={<Keycap>Tab</Keycap>}>Hide the HUD</KeyRow>
        <KeyRow keys={<Keycap>Esc</Keycap>}>Pause</KeyRow>
    </div>
);

const INFO_SECTIONS: InfoSection[] = [
    { title: "Controls", content: CONTROLS_LEGEND },
    {
        title: "Goal",
        text: "Dive through the sky: pulling tricks, grabbing rings, and sticking a safe landing to earn money then upgrade your gear and explore the stickworld!",
    },
];

export default function StickmanSkydiveClientPage() {
    const { showUiPanels, setShowUiPanels } = useUi();
    const { isTransitioning } = usePageTransition();
    const gameFrameRef = useRef<HTMLIFrameElement | null>(null);
    const playAreaRef = useRef<HTMLDivElement | null>(null);
    const [shouldLoadGame, setShouldLoadGame] = useState(false);
    const [isGameReady, setIsGameReady] = useState(false);
    const [gameLoadError, setGameLoadError] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loadAnyway, setLoadAnyway] = useState(false);

    // Phones and bare tablets have no keyboard; they see the notice until they choose to play anyway. null means not yet hydrated.
    const hasFinePointer = useHasFinePointer();
    const touchPressProps = useTouchPress();
    const canLoadGame = hasFinePointer === true || loadAnyway;
    const showDesktopOnlyNotice = hasFinePointer === false && !loadAnyway;

    // In fullscreen the play area is the whole screen and the board letterboxes inside it.
    const horizontalMargin = isFullscreen ? "0px" : "min(1rem, 3cqw)";
    const verticalMargin = isFullscreen ? "0px" : "min(calc(var(--rlg-nav-row-h) * 0.5 + 1rem), 15cqh)";
    const availableWidth = `calc(100cqw - 2 * ${horizontalMargin})`;
    const availableHeight = `calc(100cqh - 2 * ${verticalMargin})`;
    const boardWidth = `min(${availableWidth}, calc(${availableHeight} * ${ASPECT_WIDTH} / ${ASPECT_HEIGHT}))`;
    const boardToggleSize = `clamp(1rem, calc(${boardWidth} * 0.03), 3rem)`;
    const boardToggleInset = `clamp(0.35rem, calc(${boardWidth} * 0.01), 0.9rem)`;

    useEffect(() => {
        if (shouldLoadGame || isTransitioning || !canLoadGame) return;

        const timeoutId = window.setTimeout(() => setShouldLoadGame(true), 120);
        return () => window.clearTimeout(timeoutId);
    }, [canLoadGame, isTransitioning, shouldLoadGame]);

    useEffect(() => {
        const handleGameMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;

            if (event.data?.type === "RLG_GAME_READY") {
                setIsGameReady(true);
                setGameLoadError(false);
            } else if (event.data?.type === "RLG_GAME_ERROR") {
                setGameLoadError(true);
            }
        };

        window.addEventListener("message", handleGameMessage);
        return () => window.removeEventListener("message", handleGameMessage);
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

    // The browser is the source of truth for fullscreen: Esc, F11 and the button all end up here,
    // so the navbar and logo come back however the player leaves.
    useEffect(() => {
        const syncFullscreen = () => {
            const fullscreen = document.fullscreenElement !== null && document.fullscreenElement === playAreaRef.current;
            setIsFullscreen(fullscreen);
            setShowUiPanels(!fullscreen);
            // The iframe can keep its size while the DPI changes (monitor moves, browser zoom).
            gameFrameRef.current?.contentWindow?.postMessage({ type: "RLG_VIEWPORT_CHANGED" }, window.location.origin);
            window.setTimeout(requestGameFocus, 75);
        };

        document.addEventListener("fullscreenchange", syncFullscreen);
        window.addEventListener("resize", syncFullscreen);
        return () => {
            document.removeEventListener("fullscreenchange", syncFullscreen);
            window.removeEventListener("resize", syncFullscreen);
            // Leaving the page while fullscreen must not leave the navbar hidden.
            setShowUiPanels(true);
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        };
    }, [requestGameFocus, setShowUiPanels]);

    const toggleFullscreen = async () => {
        if (document.fullscreenElement) {
            await document.exitFullscreen().catch(() => {});
            return;
        }

        try {
            await playAreaRef.current?.requestFullscreen({ navigationUI: "hide" });
        } catch {
            return;
        }
        // Chromium only: keeps Esc for the game's pause menu; holding Esc still leaves fullscreen.
        const keyboard = (navigator as Navigator & { keyboard?: { lock?: (keys: string[]) => Promise<void> } }).keyboard;
        keyboard?.lock?.(["Escape"]).catch(() => {});
        requestGameFocus();
    };

    return (
        <main className="relative w-full min-w-0 bg-brand-background-dark">
            <div
                ref={playAreaRef}
                className="grid w-full place-items-center"
                style={{
                    containerType: "size",
                    height: isFullscreen ? "100%" : showUiPanels ? "max(0px, calc(100dvh - var(--rlg-nav-h)))" : "100dvh",
                    backgroundColor: isFullscreen ? "#000" : undefined,
                }}
            >
                <div className="relative">
                    <div
                        className="box-border shrink-0 overflow-hidden bg-brand-background"
                        style={{
                            width: boardWidth,
                            aspectRatio: `${ASPECT_WIDTH} / ${ASPECT_HEIGHT}`,
                            // An outline keeps the frame exactly 16:9 inside; there is no border once fullscreen.
                            outline: isFullscreen ? "none" : "4px solid #000",
                        }}
                    >
                        {showDesktopOnlyNotice && <DesktopOnlyPanel boardSize={`calc(${boardWidth} * ${ASPECT_HEIGHT} / ${ASPECT_WIDTH})`} onLoadAnyway={() => setLoadAnyway(true)} />}
                        {!showDesktopOnlyNotice && !isGameReady && (
                            <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-brand-background" aria-live="polite">
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
                                            Loading Stickman Skydive...
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        <iframe
                            ref={gameFrameRef}
                            src={shouldLoadGame
                                ? `/optimized_assets/game_assets/stickman-skydive-simulator/game.html?v=${STICKMAN_BUILD_VERSION}&revision=${STICKMAN_BUILD_REVISION}&build=Build/StickmanSkydive-${STICKMAN_BUILD_VERSION}/Build&file=StickmanSkydive-${STICKMAN_BUILD_VERSION}`
                                : "about:blank"}
                            title="Stickman Skydive"
                            className="h-full w-full border-0 focus:outline-none"
                            allow="fullscreen; autoplay; gamepad"
                            loading="eager"
                            onLoad={() => {
                                setIsGameReady(false);
                                requestGameFocus();
                            }}
                        />
                    </div>

                    {canLoadGame && (
                        <button
                            type="button"
                            className="absolute z-10 inline-flex items-center justify-center rounded-lg border-2 border-black bg-brand-accent text-brand-text transition-colors hover:bg-brand-glow active:bg-brand-glow data-[pressed=true]:bg-brand-glow"
                            style={{ width: boardToggleSize, height: boardToggleSize, right: boardToggleInset, bottom: boardToggleInset }}
                            onClick={toggleFullscreen}
                            {...touchPressProps("fullscreen")}
                            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                            aria-pressed={isFullscreen}
                        >
                            <svg viewBox="0 0 24 24" className="h-[70%] w-[70%]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                {isFullscreen ? (
                                    <>
                                        <path d="M4 9h5V4" />
                                        <path d="m4 4 5 5" />
                                        <path d="M20 9h-5V4" />
                                        <path d="m20 4-5 5" />
                                        <path d="M4 15h5v5" />
                                        <path d="m4 20 5-5" />
                                        <path d="M20 15h-5v5" />
                                        <path d="m20 20-5-5" />
                                    </>
                                ) : (
                                    <>
                                        <path d="M9 4H4v5" />
                                        <path d="m4 4 6 6" />
                                        <path d="M15 4h5v5" />
                                        <path d="m20 4-6 6" />
                                        <path d="M9 20H4v-5" />
                                        <path d="m4 20 6-6" />
                                        <path d="M15 20h5v-5" />
                                        <path d="m20 20-6-6" />
                                    </>
                                )}
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            {showUiPanels && canLoadGame && (
                <div className="mx-auto w-full max-w-[592px] px-4 pb-8">
                    <GameInfoPanel sections={INFO_SECTIONS} height="auto" showControlsDiagram compact inline className="!mt-0 max-w-none" />
                </div>
            )}
        </main>
    );
}
