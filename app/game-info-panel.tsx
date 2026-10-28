"use client";

import { useLayoutEffect, useRef } from "react";

type InfoSection = {
    title: string;
    text?: string;
    items?: string[];
};

type GameInfoPanelProps = {
    sections: InfoSection[];
    height: string;
    className?: string;
    showControlsDiagram?: boolean;
    compact?: boolean;
    fitContent?: boolean;
    inline?: boolean;
    adaptiveText?: boolean;
};

function SectionText({ text, compact }: { text: string; compact: boolean }) {
    return <p className={`engraved-text whitespace-normal ${compact ? "mt-1 text-[1em] leading-tight" : "mt-2 text-[1.5rem] leading-snug"} text-brand-text`}>{text}</p>;
}

function SectionList({ items, compact }: { items: string[]; compact: boolean }) {
    return (
        <ul className={`engraved-text list-disc space-y-1 pl-5 ${compact ? "mt-1 text-[1em] leading-tight" : "mt-2 text-[1.5rem] leading-snug"} text-brand-text marker:text-brand-background`}>
            {items.map((item) => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    );
}

function ControlKey({ label, className = "", compact }: { label: string; className?: string; compact: boolean }) {
    return (
        <span
            className={`inline-flex items-center justify-center rounded-md border border-black/80 bg-black/35 font-black tracking-wide text-brand-glow ${compact ? "h-[1.6em] w-[1.6em] text-[1em]" : "h-8 w-8 text-[1.25rem]"} ${className}`}
        >
            {label}
        </span>
    );
}

function ControlsDiagram({ compact }: { compact: boolean }) {
    return (
        <div className={`flex flex-wrap justify-center ${compact ? "mt-2 gap-2" : "mt-3 gap-3"}`}>
            <div className={`w-fit rounded-md border border-black/75 bg-black/25 ${compact ? "p-1.5" : "p-2"}`}>
                <p className={`engraved-text text-center font-bold uppercase tracking-wider text-brand-glow ${compact ? "mb-1 text-[1em]" : "mb-2 text-[1.5rem]"}`}>WASD</p>
                <div className="mx-auto grid w-fit grid-cols-3 justify-items-center gap-1.5">
                    <span />
                    <ControlKey label="W" compact={compact} />
                    <span />
                    <ControlKey label="A" compact={compact} />
                    <ControlKey label="S" compact={compact} />
                    <ControlKey label="D" compact={compact} />
                </div>
            </div>
            <div className={`w-fit rounded-md border border-black/75 bg-black/25 ${compact ? "p-1.5" : "p-2"}`}>
                <p className={`engraved-text text-center font-bold uppercase tracking-wider text-brand-glow ${compact ? "mb-1 text-[1em]" : "mb-2 text-[1.5rem]"}`}>Arrows</p>
                <div className="mx-auto grid w-fit grid-cols-3 justify-items-center gap-1.5">
                    <span />
                    <ControlKey label="↑" compact={compact} />
                    <span />
                    <ControlKey label="←" compact={compact} />
                    <ControlKey label="↓" compact={compact} />
                    <ControlKey label="→" compact={compact} />
                </div>
            </div>
        </div>
    );
}

export default function GameInfoPanel({ sections, height, className = "", showControlsDiagram = false, compact = false, fitContent = false, inline = false, adaptiveText = false }: GameInfoPanelProps) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const viewport = viewportRef.current;
        const content = contentRef.current;
        if (!adaptiveText || !compact || !viewport || !content) return;

        const fitText = () => {
            const styles = getComputedStyle(viewport);
            const availableHeight = viewport.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
            if (availableHeight <= 0) return;

            // Respect the reader's root font size: below 1rem, keep text readable
            // and allow scrolling. Measurements happen only on resize/font load.
            const minimum = parseFloat(getComputedStyle(document.documentElement).fontSize);
            let low = minimum;
            let high = Math.max(minimum, availableHeight);
            viewport.style.overflowY = "hidden";
            content.style.removeProperty("min-height");
            content.style.fontSize = `${minimum}px`;
            if (content.scrollHeight <= availableHeight && content.scrollWidth <= content.clientWidth) {
                while (high - low > 0.25) {
                    const middle = (low + high) / 2;
                    content.style.fontSize = `${middle}px`;
                    if (content.scrollHeight <= availableHeight && content.scrollWidth <= content.clientWidth) low = middle;
                    else high = middle;
                }
            }
            content.style.fontSize = `${low}px`;
            // Distribute spare space left by line wrapping between sections.
            content.style.minHeight = `${availableHeight}px`;
            viewport.style.overflowY = "auto";
        };

        fitText();
        const observer = new ResizeObserver(fitText);
        observer.observe(viewport);
        document.fonts.addEventListener("loadingdone", fitText);
        return () => {
            observer.disconnect();
            document.fonts.removeEventListener("loadingdone", fitText);
            content.style.removeProperty("font-size");
            content.style.removeProperty("min-height");
            viewport.style.removeProperty("overflow-y");
        };
    }, [adaptiveText, compact, showControlsDiagram]);
    const positioningClass = inline
        ? "xl:mt-0"
        : "xl:mt-0 xl:absolute xl:left-[calc(100%+1.5rem)] xl:top-1/2 xl:w-[400px] xl:max-w-none xl:-translate-y-1/2";

    return (
        <aside
            className={`mt-12 w-full max-w-[400px] border-4 border-black bg-brand-pipe ${positioningClass} ${className}`}
            style={fitContent ? { height: "auto", minHeight: height } : { height }}
        >
            <div
                ref={viewportRef}
                className={`${fitContent ? "flex flex-col justify-between" : "h-full overflow-y-auto"} ${compact ? "p-2.5" : "p-4"}`}
                style={fitContent ? { minHeight: `calc(${height} - 8px)` } : undefined}
            >
                <div ref={contentRef} className={`${adaptiveText || fitContent ? "flex flex-1 flex-col justify-between" : "flow-root"} ${compact ? "text-xl" : ""}`}>
                    {sections.map((section, index) => (
                        <div key={section.title} className={`shrink-0 ${fitContent ? "" : index === 0 ? "" : compact ? "mt-1.5" : "mt-3"} rounded-md border border-black/70 bg-black/20 ${compact ? "p-2.5" : "p-3"}`}>
                            <h2 className={`engraved-title whitespace-nowrap font-bold uppercase tracking-wide ${compact ? "text-[1.28em]" : "text-[1.75rem]"}`}>{section.title}</h2>
                            {showControlsDiagram && section.title === "Controls" && <ControlsDiagram compact={compact} />}
                            {section.text && <SectionText text={section.text} compact={compact} />}
                            {section.items && <SectionList items={section.items} compact={compact} />}
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
}

export type { InfoSection };
