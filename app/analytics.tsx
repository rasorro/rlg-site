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

    return <Script data-goatcounter="https://reactionlabs.goatcounter.com/count" src="//gc.zgo.at/count.js" strategy="afterInteractive" />;
}
