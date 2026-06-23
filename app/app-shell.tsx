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
    const showFactoryEffects = pathname === "/";
    const showLogoCircle = pathname !== "/rapid-path" || showUiPanels;

    useEffect(() => {
        document.body.classList.toggle("no-fog", !showFactoryEffects);

        return () => {
            document.body.classList.remove("no-fog");
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
