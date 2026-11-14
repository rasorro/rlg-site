"use client";

import { useEffect, useRef, useState } from "react";
import GameInfoPanel, { type InfoSection } from "../game-info-panel";
import { RAPID_PATH_BUILD } from "../games";
import { BoardToggleButton, GameFrame, useUnityGame } from "../unity-game";
import { useUi } from "../ui-context";

const KEYBOARD_CONTROLS: InfoSection = { title: "Controls", text: "" };

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

type InstructionsLayout = { top: number; left: number; width: number; height: number };

export default function RapidPathClientPage() {
    const { showUiPanels, setShowUiPanels } = useUi();
    const playAreaRef = useRef<HTMLDivElement | null>(null);
    const boardRef = useRef<HTMLDivElement | null>(null);
    const [instructionsLayout, setInstructionsLayout] = useState<InstructionsLayout | null>(null);
    const [focusMarginRatio, setFocusMarginRatio] = useState(0.05);

    const game = useUnityGame();
    const { canLoadGame, requestGameFocus, notifyViewportChanged } = game;
    const showControls = showUiPanels && canLoadGame;
    const infoSections = [KEYBOARD_CONTROLS, ...OTHER_INFO_SECTIONS];
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

    const boardSize = `min(${availableWidth}, ${availableHeight})`;

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
        const syncWindowSize = () => {
            notifyViewportChanged();
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
    }, [notifyViewportChanged]);

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
            <h1 className="sr-only">Rapid Path</h1>
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
                        style={{ width: boardSize, height: boardSize }}
                    >
                        <GameFrame build={RAPID_PATH_BUILD} game={game} title="Rapid Path" boardSize={boardSize} />
                    </div>

                    {canLoadGame && (
                        <BoardToggleButton
                            active={!showUiPanels}
                            label={showUiPanels ? "Enter focus mode" : "Exit focus mode"}
                            onClick={toggleFocusMode}
                            boardSize={boardSize}
                            sizeRatio={0.0425}
                            insetRatio={0.013}
                            pressKey="focus"
                        />
                    )}
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
                        showControlsDiagram
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
