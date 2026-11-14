"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import GameInfoPanel, { type InfoSection } from "../game-info-panel";
import { STICKMAN_BUILD } from "../games";
import { useUi } from "../ui-context";
import { BoardToggleButton, GameFrame, useUnityGame } from "../unity-game";

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
            <div className="flex w-[11em] shrink-0 flex-wrap items-center gap-[0.25em]">{keys}</div>
            <span className="engraved-text leading-tight">{children}</span>
        </div>
    );
}

// Shown under the WASD / arrows diagram: what each key does.
const CONTROLS_LEGEND = (
    <div className="mt-2 flex flex-col gap-[0.4em]">
        <KeyRow keys={<><Keycap>A</Keycap><Keycap>D</Keycap><span className="engraved-text px-[0.1em]">or</span><Keycap>←</Keycap><Keycap>→</Keycap></>}>
            Move left or right through the sky
        </KeyRow>
        <KeyRow keys={<><Keycap>W</Keycap><Keycap>S</Keycap><span className="engraved-text px-[0.1em]">or</span><Keycap>↑</Keycap><Keycap>↓</Keycap></>}>
            Tilt your body up or down
        </KeyRow>
        <KeyRow keys={<Keycap>Shift</Keycap>}>Hold to tighten your limbs and fall faster</KeyRow>
        <KeyRow keys={<Keycap>Space</Keycap>}>Jump from the plane, then open your chute</KeyRow>
        <KeyRow keys={<Keycap>Left Click</Keycap>}>Zoom out</KeyRow>
        <KeyRow keys={<Keycap>Right Click</Keycap>}>Zoom in</KeyRow>
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
    const playAreaRef = useRef<HTMLDivElement | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const game = useUnityGame();
    const { canLoadGame, requestGameFocus, notifyViewportChanged } = game;

    // In fullscreen the play area is the whole screen and the board letterboxes inside it.
    const horizontalMargin = isFullscreen ? "0px" : "min(1rem, 3cqw)";
    const verticalMargin = isFullscreen ? "0px" : "min(calc(var(--rlg-nav-row-h) * 0.5 + 1rem), 15cqh)";
    const availableWidth = `calc(100cqw - 2 * ${horizontalMargin})`;
    const availableHeight = `calc(100cqh - 2 * ${verticalMargin})`;
    const boardWidth = `min(${availableWidth}, calc(${availableHeight} * ${ASPECT_WIDTH} / ${ASPECT_HEIGHT}))`;

    // The browser is the source of truth for fullscreen: Esc, F11 and the button all end up here,
    // so the navbar and logo come back however the player leaves.
    useEffect(() => {
        const syncFullscreen = () => {
            const fullscreen = document.fullscreenElement !== null && document.fullscreenElement === playAreaRef.current;
            setIsFullscreen(fullscreen);
            setShowUiPanels(!fullscreen);
            notifyViewportChanged();
            window.setTimeout(requestGameFocus, 75);
        };

        document.addEventListener("fullscreenchange", syncFullscreen);
        window.addEventListener("resize", syncFullscreen);
        return () => {
            document.removeEventListener("fullscreenchange", syncFullscreen);
            window.removeEventListener("resize", syncFullscreen);
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        };
    }, [notifyViewportChanged, requestGameFocus, setShowUiPanels]);

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
            <h1 className="sr-only">Stickman Skydive</h1>
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
                        <GameFrame
                            build={STICKMAN_BUILD}
                            game={game}
                            title="Stickman Skydive"
                            boardSize={`calc(${boardWidth} * ${ASPECT_HEIGHT} / ${ASPECT_WIDTH})`}
                        />
                    </div>

                    {canLoadGame && (
                        <BoardToggleButton
                            active={isFullscreen}
                            label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                            onClick={toggleFullscreen}
                            boardSize={boardWidth}
                            sizeRatio={0.03}
                            insetRatio={0.01}
                            pressKey="fullscreen"
                        />
                    )}
                </div>
            </div>
            {showUiPanels && canLoadGame && (
                <div className="mx-auto w-full max-w-[840px] px-4 pb-8">
                    <GameInfoPanel sections={INFO_SECTIONS} height="auto" showControlsDiagram compact inline className="!mt-0 max-w-none" />
                </div>
            )}
        </main>
    );
}
