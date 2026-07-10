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
    const isRapidPathRoute = pathname.startsWith("/rapid-path");
    const showFactoryEffects = pathname === "/";
    const showLogoCircle = !isRapidPathRoute || showUiPanels;

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
            <div className="hide-scrollbar relative flex h-full flex-col overflow-y-auto overflow-x-hidden">
                <FactoryBackdrop showFactoryEffects={showFactoryEffects} showLogoCircle={showLogoCircle} />
                <Navbar />
                {children}
            </div>
        </PageTransitionProvider>
    );
}
