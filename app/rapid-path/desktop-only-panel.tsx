"use client";

import { useState } from "react";
import { useTouchPress } from "../touch-press";

type DesktopOnlyPanelProps = {
    boardSize: string;
    onLoadAnyway: () => void;
};

const BUTTON_GLOSS = "linear-gradient(to bottom, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.15) 45%, rgba(255, 255, 255, 0))";

// Shown in place of the game board on touch-only devices, so they don't download the build unless they choose to play with swipe controls.
export default function DesktopOnlyPanel({ boardSize, onLoadAnyway }: DesktopOnlyPanelProps) {
    const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
    const touchPressProps = useTouchPress();

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopyState("copied");
        } catch {
            setCopyState("failed");
        }
    };

    return (
        <div
            className="absolute inset-0 z-[1] flex flex-col items-center justify-center-safe overflow-y-auto gap-[0.9em] border-4 border-black bg-brand-pipe p-[1em] text-center"
            style={{ fontSize: `max(11px, calc(${boardSize} / 22))` }}
        >
            <div className="shrink-0 border-3 border-black bg-brand-background px-[0.75em] py-[0.35em] leading-none">
                <h1 className="engraved-title text-[1.6em] font-bold">BEST ON DESKTOP</h1>
            </div>

            <p className="engraved-text max-w-[18em] shrink-0 rounded-md border border-black/70 bg-black/20 px-[0.6em] py-[0.4em] leading-snug">
                Rapid Path plays best with a keyboard, so a computer is recommended. You can still play here by swiping the board.
            </p>

            <button
                type="button"
                onClick={copyLink}
                {...touchPressProps("copy")}
                className="relative inline-flex shrink-0 items-center overflow-hidden rounded-xl border-3 border-white/40 bg-brand-button px-[0.9em] py-[0.4em] font-bold leading-none ring-2 ring-black transition hover:bg-brand-glow active:bg-brand-glow data-[pressed=true]:bg-brand-glow"
            >
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 rounded-[10px] bg-white opacity-[0.15]" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-0" style={{ background: BUTTON_GLOSS }} />
                <span className="engraved-title relative z-10" aria-live="polite">
                    {copyState === "copied" ? "LINK COPIED!" : "COPY LINK"}
                </span>
            </button>
            {copyState === "failed" && (
                <p className="engraved-text text-[0.75em] leading-snug break-all">{window.location.href}</p>
            )}

            <button type="button" onClick={onLoadAnyway} {...touchPressProps("load")} className="shrink-0 engraved-text text-[0.85em] underline opacity-80 transition hover:opacity-100 active:opacity-100 data-[pressed=true]:opacity-100">
                Play here with swipe controls
            </button>
        </div>
    );
}
