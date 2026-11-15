"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
    interface Window {
        goatcounter?: { count: (vars: { path?: string; title?: string; event?: boolean }) => void };
    }
}

// Custom event in GoatCounter (shown under "events"). Silently does nothing if the script is blocked or still loading.
export function trackEvent(name: string) {
    window.goatcounter?.count({ path: name, title: name, event: true });
}

// count.js counts the first page load itself; this counts the in-app navigations after it (the site is a static export with client-side routing).
export default function Analytics() {
    const pathname = usePathname();
    const isFirstView = useRef(true);

    useEffect(() => {
        if (isFirstView.current) {
            isFirstView.current = false;
            return;
        }
        window.goatcounter?.count({ path: pathname });
    }, [pathname]);

    // Active time per page: counts a second only while the tab is visible and focused and the visitor did something in the last 30s.
    // The game iframe is same-origin, so its input is watched too (a player on the keyboard never touches the parent page).
    useEffect(() => {
        const MILESTONES: [number, string][] = [[30, "30s"], [60, "1min"], [120, "2min"], [300, "5min"], [600, "10min"]];
        const INPUTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"];
        const watched = new WeakSet<Window>();
        let lastActivity = Date.now();
        let active = 0;
        let next = 0;
        const markActive = () => {
            lastActivity = Date.now();
        };
        const watch = (target: Window) => {
            if (watched.has(target)) return;
            watched.add(target);
            for (const type of INPUTS) target.addEventListener(type, markActive, { passive: true, capture: true });
        };

        watch(window);
        const timer = window.setInterval(() => {
            for (const frame of document.querySelectorAll("iframe")) {
                try {
                    if (frame.contentWindow) watch(frame.contentWindow);
                } catch {
                    // Cross-origin frame: nothing to watch.
                }
            }
            if (document.visibilityState !== "visible" || !document.hasFocus() || Date.now() - lastActivity > 30_000) return;
            active += 1;
            if (next < MILESTONES.length && active >= MILESTONES[next][0]) trackEvent(`active${pathname}${MILESTONES[next++][1]}`);
        }, 1000);

        return () => {
            window.clearInterval(timer);
            for (const type of INPUTS) window.removeEventListener(type, markActive, { capture: true });
        };
    }, [pathname]);

    // One delegated listener catches every email and external link (contact page, Instagram, and any added later).
    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            const link = (event.target as Element | null)?.closest?.("a[href]");
            if (!link) return;
            const url = new URL((link as HTMLAnchorElement).href, window.location.href);
            if (url.protocol === "mailto:") trackEvent("outbound/email");
            else if (url.origin !== window.location.origin) trackEvent(`outbound/${url.hostname}`);
        };
        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
    }, []);

    return <Script data-goatcounter="https://reactionlabs.goatcounter.com/count" src="//gc.zgo.at/count.js" strategy="afterInteractive" />;
}
