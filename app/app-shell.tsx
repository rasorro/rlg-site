"use client";

import Navbar from "./navbar";
import { useUi } from "./ui-context";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { showUiPanels } = useUi();

    return (
        <div className={showUiPanels ? "flex min-h-full flex-col pt-14" : "flex min-h-full flex-col"}>
            <Navbar />
            {children}
        </div>
    );
}
