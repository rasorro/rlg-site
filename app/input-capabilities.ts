import { useSyncExternalStore } from "react";

// Keyboard games (Rapid Path) can't detect a keyboard directly; a mouse or trackpad is the closest signal.
// Phones and bare tablets report no fine pointer; laptops, desktops and tablets with a trackpad keyboard do.
const FINE_POINTER_QUERY = "(any-pointer: fine)";

function subscribe(onChange: () => void) {
    const mediaQuery = window.matchMedia(FINE_POINTER_QUERY);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
}

// null until hydrated (the server can't know the device), then true/false.
export function useHasFinePointer(): boolean | null {
    return useSyncExternalStore(
        subscribe,
        () => window.matchMedia(FINE_POINTER_QUERY).matches,
        () => null,
    );
}
