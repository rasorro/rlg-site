"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import DesktopOnlyPanel from "./desktop-only-panel";
import { gameFrameSrc, type UnityBuild } from "./games";
import { useHasFinePointer } from "./input-capabilities";
import { usePageTransition } from "./page-transition";
import { useTouchPress } from "./touch-press";
import { useUi } from "./ui-context";

type GameMessage = Record<string, unknown> & { type?: string };

// State and messaging shared by every Unity game page (iframe loading, ready/error messages, focus, touch opt-in).
export function useUnityGame(onGameMessage?: (message: GameMessage) => void) {
    const { setShowUiPanels } = useUi();
    const { isTransitioning } = usePageTransition();
    const frameRef = useRef<HTMLIFrameElement | null>(null);
    const [shouldLoadGame, setShouldLoadGame] = useState(false);
    const [isGameReady, setIsGameReady] = useState(false);
    const [gameLoadError, setGameLoadError] = useState(false);
    const [loadAnyway, setLoadAnyway] = useState(false);

    // Phones and bare tablets have no keyboard; they see the notice until they choose to play anyway. null means not yet hydrated.
    const hasFinePointer = useHasFinePointer();
    const canLoadGame = hasFinePointer === true || loadAnyway;
    const showDesktopOnlyPanel = hasFinePointer === false && !loadAnyway;

    const onGameMessageRef = useRef(onGameMessage);
    useEffect(() => {
        onGameMessageRef.current = onGameMessage;
    });

    // Leaving a game page (Back button included) must not leave the navbar hidden by focus mode / fullscreen.
    useEffect(() => () => setShowUiPanels(true), [setShowUiPanels]);

    // Wait for the page transition to finish so Unity's startup doesn't compete with the animation.
    useEffect(() => {
        if (shouldLoadGame || isTransitioning || !canLoadGame) return;

        const timeoutId = window.setTimeout(() => setShouldLoadGame(true), 120);
        return () => window.clearTimeout(timeoutId);
    }, [canLoadGame, isTransitioning, shouldLoadGame]);

    useEffect(() => {
        const handleGameMessage = (event: MessageEvent) => {
            // Only the game's own iframe may talk to the page, not any other same-site window.
            if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;

            if (event.data?.type === "RLG_GAME_READY") {
                setIsGameReady(true);
                setGameLoadError(false);
            } else if (event.data?.type === "RLG_GAME_ERROR") {
                setGameLoadError(true);
            } else if (event.data) {
                onGameMessageRef.current?.(event.data);
            }
        };

        window.addEventListener("message", handleGameMessage);
        return () => window.removeEventListener("message", handleGameMessage);
    }, []);

    const requestGameFocus = useCallback(() => {
        const frame = frameRef.current;
        if (!frame) return;

        frame.focus({ preventScroll: true });
        try {
            frame.contentWindow?.postMessage({ type: "RLG_FOCUS_GAME" }, window.location.origin);
            frame.contentWindow?.focus();
        } catch {
            // Ignore cross-frame focus errors in restrictive environments.
        }
    }, []);

    // The parent viewport/DPI can change while the iframe keeps the same size, so its own resize event is not enough.
    const notifyViewportChanged = useCallback(() => {
        frameRef.current?.contentWindow?.postMessage({ type: "RLG_VIEWPORT_CHANGED" }, window.location.origin);
    }, []);

    return {
        frameRef,
        shouldLoadGame,
        isGameReady,
        setIsGameReady,
        gameLoadError,
        setLoadAnyway,
        canLoadGame,
        showDesktopOnlyPanel,
        requestGameFocus,
        notifyViewportChanged,
    };
}

type UnityGameState = ReturnType<typeof useUnityGame>;

// The desktop-only notice, loading / error overlay and the game iframe. Goes inside a sized, overflow-hidden board.
export function GameFrame({ build, game, title, boardSize }: { build: UnityBuild; game: UnityGameState; title: string; boardSize: string }) {
    const { frameRef, shouldLoadGame, isGameReady, setIsGameReady, gameLoadError, setLoadAnyway, showDesktopOnlyPanel, requestGameFocus } = game;

    return (
        <>
            {showDesktopOnlyPanel && <DesktopOnlyPanel boardSize={boardSize} onLoadAnyway={() => setLoadAnyway(true)} />}
            {!showDesktopOnlyPanel && !isGameReady && (!shouldLoadGame || gameLoadError) && (
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
                            <span className="text-center text-xl font-bold uppercase tracking-wide">Loading {title}...</span>
                        </div>
                    )}
                </div>
            )}
            <iframe
                ref={frameRef}
                src={shouldLoadGame ? gameFrameSrc(build) : "about:blank"}
                title={title}
                className="h-full w-full border-0 focus:outline-none"
                allow="fullscreen; autoplay; gamepad"
                loading="eager"
                onLoad={() => {
                    setIsGameReady(false);
                    requestGameFocus();
                }}
            />
        </>
    );
}

// Bottom-right button on the board that toggles focus mode (Rapid Path) or fullscreen (Stickman Skydive).
export function BoardToggleButton({
    active,
    label,
    onClick,
    boardSize,
    sizeRatio,
    insetRatio,
    pressKey,
}: {
    active: boolean;
    label: string;
    onClick: () => void;
    boardSize: string;
    // Button size and corner inset as fractions of boardSize (tuned per game: Rapid Path is square, Stickman is 16:9).
    sizeRatio: number;
    insetRatio: number;
    pressKey: string;
}) {
    const touchPressProps = useTouchPress();
    const style: CSSProperties = {
        width: `clamp(1.5rem, calc(${boardSize} * ${sizeRatio}), 3rem)`,
        height: `clamp(1.5rem, calc(${boardSize} * ${sizeRatio}), 3rem)`,
        right: `clamp(0.35rem, calc(${boardSize} * ${insetRatio}), 0.9rem)`,
        bottom: `clamp(0.35rem, calc(${boardSize} * ${insetRatio}), 0.9rem)`,
    };

    return (
        <button
            type="button"
            className="absolute z-10 inline-flex items-center justify-center rounded-lg border-2 border-black bg-brand-accent text-brand-text transition-colors hover:bg-brand-glow active:bg-brand-glow data-[pressed=true]:bg-brand-glow"
            style={style}
            onClick={onClick}
            {...touchPressProps(pressKey)}
            aria-label={label}
            title={label}
            aria-pressed={active}
        >
            <svg viewBox="0 0 24 24" className="h-[70%] w-[70%]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                {active ? (
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
    );
}
