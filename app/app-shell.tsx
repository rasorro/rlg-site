"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import FactoryBackdrop from "./factoryBackdrop";
import Navbar from "./navbar";
import { PageTransitionProvider } from "./page-transition";
import { useUi } from "./ui-context";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { showUiPanels } = useUi();
    // Game pages hide the navbar and logo in focus mode / fullscreen. The backdrop measures the navbar's home
    // link when showLogoCircle changes, so these routes must toggle it with the navbar or the logo keeps a stale (detached) measurement.
    const isGameRoute = pathname.startsWith("/rapid-path") || pathname.startsWith("/stickman-skydive-simulator");
    const showFactoryEffects = pathname === "/";
    const showLogoCircle = !isGameRoute || showUiPanels;

    useEffect(() => {
        document.body.classList.toggle("no-fog", !showFactoryEffects);
        document.body.classList.toggle("homepage-background", showFactoryEffects);

        return () => {
            document.body.classList.remove("no-fog");
            document.body.classList.remove("homepage-background");
        };
    }, [showFactoryEffects]);

    return (
        <PageTransitionProvider topOffset={showUiPanels ? "var(--rlg-nav-h)" : "0px"}>
            <div className="relative flex min-h-dvh flex-col">
                <FactoryBackdrop showFactoryEffects={showFactoryEffects} showLogoCircle={showLogoCircle} />
                <Navbar />
                {children}
            </div>
        </PageTransitionProvider>
    );
}
