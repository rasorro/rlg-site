import { useEffect, useRef, useState, type PointerEvent } from "react";

// Matches the flask's tap glow in factoryBackdrop.
const TOUCH_PRESS_MS = 1400;

// Touch has no hover (Tailwind's hover: only applies on hover-capable devices), so a tap
// holds a button's hover look briefly. Style it with data-[pressed=true]:..., alongside hover:.
export function useTouchPress(onPressChange?: (pressed: boolean) => void) {
    const [pressedKey, setPressedKey] = useState<string | null>(null);
    const timeoutRef = useRef(0);
    const onPressChangeRef = useRef(onPressChange);

    useEffect(() => {
        onPressChangeRef.current = onPressChange;
    }, [onPressChange]);

    useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

    return (key = "default") => ({
        "data-pressed": pressedKey === key,
        onPointerDown: (event: PointerEvent) => {
            if (event.pointerType !== "touch") return;
            setPressedKey(key);
            onPressChangeRef.current?.(true);
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = window.setTimeout(() => {
                setPressedKey(null);
                onPressChangeRef.current?.(false);
            }, TOUCH_PRESS_MS);
        },
    });
}
