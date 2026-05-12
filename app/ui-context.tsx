"use client";

import { createContext, useContext, useState } from "react";

type UiContextType = {
    showUiPanels: boolean;
    setShowUiPanels: (value: boolean) => void;
};

const UiContext = createContext<UiContextType>({
    showUiPanels: true,
    setShowUiPanels: () => {},
});

export function UiProvider({ children }: { children: React.ReactNode }) {
    const [showUiPanels, setShowUiPanels] = useState(true);
    return (
        <UiContext.Provider value={{ showUiPanels, setShowUiPanels }}>
            {children}
        </UiContext.Provider>
    );
}

export function useUi() {
    return useContext(UiContext);
}
