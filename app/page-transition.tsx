"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type MouseEvent,
} from "react";

type TransitionMode = "idle" | "covering" | "waiting-route" | "revealing";

type Bubble = {
    x: number;
    radius: number;
    alpha: number;
    speed: number;
    bornAtMs: number;
    wobbleAmp: number;
    wobbleFreq: number;
    phase: number;
};

type PageTransitionContextValue = {
    startTransition: (href: string) => void;
    isTransitioning: boolean;
};

type PageTransitionProviderProps = {
    children: React.ReactNode;
    topOffset?: string;
};

type TransitionLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
    href: string;
};

const COVER_DURATION_MS = 900;
const REVEAL_DURATION_MS = 780;
const ROUTE_SWITCH_COVERAGE = 0.9;
const ROUTE_NAVIGATION_DELAY_MS = 900;
const BUBBLE_SIZE_MULTIPLIER = 4;
const BUBBLE_SPEED_MULTIPLIER = 4;
const BUBBLE_DENSITY_MULTIPLIER = 3;
const BUBBLE_SPAWN_RAMP_MS = 250;
const BUBBLE_SPAWN_TAPER_MS = 700;
const BASE_BUBBLE_RADIUS_MIN = 15;
const BASE_BUBBLE_RADIUS_MAX = 25;
const BASE_BUBBLE_SPEED_MIN = 180;
const BASE_BUBBLE_SPEED_MAX = 420;
const BASE_BUBBLE_AREA_PER_PARTICLE = 6200;
const BUBBLE_ACTIVE_MIN = 96;
const BUBBLE_ACTIVE_MAX = 900;
const MAX_CANVAS_DPR = 1.25;
const GOLDEN_RATIO_CONJUGATE = 0.61803398875;
const SPAWN_LANE_COUNT = 14;
const SPAWN_LANE_SEARCH_RADIUS = 2;

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null);

function easeOutCubic(value: number) {
    return 1 - Math.pow(1 - value, 3);
}

function clamp01(value: number) {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
}

function fract(value: number) {
    return value - Math.floor(value);
}

function getBalancedSpawnRatio(spawnIndex: number, laneCounts: number[]): number {
    const laneCount = laneCounts.length;
    const preferredRatio = fract(spawnIndex * GOLDEN_RATIO_CONJUGATE);
    const preferredLane = Math.floor(preferredRatio * laneCount);

    let bestLane = preferredLane;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let offset = -SPAWN_LANE_SEARCH_RADIUS; offset <= SPAWN_LANE_SEARCH_RADIUS; offset += 1) {
        const lane = (preferredLane + offset + laneCount) % laneCount;
        const occupancyCost = laneCounts[lane];
        const distanceCost = Math.abs(offset) * 0.35;
        const randomTieBreaker = Math.random() * 0.12;
        const score = occupancyCost + distanceCost + randomTieBreaker;

        if (score < bestScore) {
            bestScore = score;
            bestLane = lane;
        }
    }

    laneCounts[bestLane] += 1;

    const laneCenterRatio = (bestLane + 0.5) / laneCount;
    const laneJitter = (Math.random() - 0.5) * (0.72 / laneCount);
    return clamp01(laneCenterRatio + laneJitter);
}

function createBubbleSprite() {
    const sprite = document.createElement("canvas");
    sprite.width = 96;
    sprite.height = 96;

    const ctx = sprite.getContext("2d");
    if (!ctx) return sprite;

    const center = 48;
    const radius = 44;

    const fill = ctx.createRadialGradient(center - 10, center - 12, 6, center, center, radius);
    fill.addColorStop(0, "rgba(142, 255, 139, 1.0)");
    fill.addColorStop(0.45, "rgba(142, 255, 139, 1.0)");
    fill.addColorStop(1, "rgba(145, 138, 129, 1.0)");

    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(center, center, radius - 1.5, 0, Math.PI * 2);
    ctx.stroke();

    const highlight = ctx.createRadialGradient(center - 18, center - 18, 2, center - 12, center - 12, 20);
    highlight.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    highlight.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(center - 14, center - 14, 18, 0, Math.PI * 2);
    ctx.fill();

    return sprite;
}

function createBubble(width: number, bornAtMs: number, xRatio: number): Bubble {
    const depth = Math.random();
    const baseRadius = BASE_BUBBLE_RADIUS_MIN + depth * (BASE_BUBBLE_RADIUS_MAX - BASE_BUBBLE_RADIUS_MIN);
    const baseSpeed = BASE_BUBBLE_SPEED_MIN + Math.random() * (BASE_BUBBLE_SPEED_MAX - BASE_BUBBLE_SPEED_MIN);

    return {
        x: xRatio * width,
        radius: baseRadius * BUBBLE_SIZE_MULTIPLIER,
        alpha: 0.55 + Math.random() * 0.4,
        speed: baseSpeed * BUBBLE_SPEED_MULTIPLIER,
        bornAtMs,
        wobbleAmp: 1.4 + (1 - depth) * 6,
        wobbleFreq: 0.9 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
    };
}

function getBubbleFieldTargetCount(width: number, height: number): number {
    const area = width * height;
    const scaledCount = Math.round((area / BASE_BUBBLE_AREA_PER_PARTICLE) * BUBBLE_DENSITY_MULTIPLIER);
    return Math.max(BUBBLE_ACTIVE_MIN, Math.min(BUBBLE_ACTIVE_MAX, scaledCount));
}

export function PageTransitionProvider({ children, topOffset = "0px" }: PageTransitionProviderProps) {
    const router = useRouter();
    const pathname = usePathname();

    const [mode, setMode] = useState<TransitionMode>("idle");

    const overlayRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const spriteRef = useRef<HTMLCanvasElement | null>(null);
    const bubblesRef = useRef<Bubble[]>([]);
    const coverageRef = useRef(0);
    const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });
    const rafIdRef = useRef<number | null>(null);
    const navigationDelayIdRef = useRef<number | null>(null);
    const pendingHrefRef = useRef<string | null>(null);
    const pathAtStartRef = useRef(pathname);
    const modeRef = useRef<TransitionMode>("idle");
    const transitionStartTimeRef = useRef<number | null>(null);
    const transitionLockRef = useRef(false);
    const minCoverCompleteRef = useRef(false);
    const routeReadyRef = useRef(false);
    const drainingStartedRef = useRef(false);
    const drainStartTimeRef = useRef<number | null>(null);
    const spawnEnabledRef = useRef(false);
    const lastFrameTimeRef = useRef<number | null>(null);
    const smoothedFrameTimeMsRef = useRef(16);
    const qualityScaleRef = useRef(1);
    const spawnCarryRef = useRef(0);
    const spawnIndexRef = useRef(0);
    const targetBubbleCountRef = useRef(220);

    const finalizeTransition = useCallback(() => {
        if (rafIdRef.current !== null) {
            window.cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
        if (navigationDelayIdRef.current !== null) {
            window.clearTimeout(navigationDelayIdRef.current);
            navigationDelayIdRef.current = null;
        }
        pendingHrefRef.current = null;
        coverageRef.current = 0;
        transitionStartTimeRef.current = null;
        transitionLockRef.current = false;
        minCoverCompleteRef.current = false;
        routeReadyRef.current = false;
        drainingStartedRef.current = false;
        drainStartTimeRef.current = null;
        spawnEnabledRef.current = false;
        lastFrameTimeRef.current = null;
        smoothedFrameTimeMsRef.current = 16;
        qualityScaleRef.current = 1;
        spawnCarryRef.current = 0;
        spawnIndexRef.current = 0;
        bubblesRef.current = [];
        setMode("idle");
    }, []);

    const beginDrainIfReady = useCallback(() => {
        if (drainingStartedRef.current) return;
        if (!minCoverCompleteRef.current || !routeReadyRef.current) return;

        drainingStartedRef.current = true;
        drainStartTimeRef.current = performance.now();
        setMode("revealing");
    }, []);

    const drawFrame = useCallback((timeMs: number) => {
        const ctx = ctxRef.current;
        const sprite = spriteRef.current;
        if (!ctx || !sprite) return;

        const { width, height } = sizeRef.current;
        const coverage = coverageRef.current;

        ctx.clearRect(0, 0, width, height);
        if (coverage <= 0.001) return;

        const previousFrameTime = lastFrameTimeRef.current ?? timeMs;
        const frameDeltaSeconds = Math.max(0, (timeMs - previousFrameTime) * 0.001);
        const frameDeltaMs = frameDeltaSeconds * 1000;
        lastFrameTimeRef.current = timeMs;

        const prevSmoothed = smoothedFrameTimeMsRef.current;
        const smoothedFrameTimeMs = prevSmoothed + (frameDeltaMs - prevSmoothed) * 0.14;
        smoothedFrameTimeMsRef.current = smoothedFrameTimeMs;

        const qualityScale = qualityScaleRef.current;
        if (smoothedFrameTimeMs > 20 && qualityScale > 0.72) {
            qualityScaleRef.current = Math.max(0.72, qualityScale - 0.035);
        } else if (smoothedFrameTimeMs < 15 && qualityScale < 1) {
            qualityScaleRef.current = Math.min(1, qualityScale + 0.02);
        }

        if (spawnEnabledRef.current && frameDeltaSeconds > 0) {
            const transitionStartTime = transitionStartTimeRef.current ?? timeMs;
            const elapsedSinceStartMs = Math.max(0, timeMs - transitionStartTime);
            const rampProgress = clamp01(elapsedSinceStartMs / BUBBLE_SPAWN_RAMP_MS);
            const rampIntensity = Math.sin((Math.PI / 2) * rampProgress);

            let taperIntensity = 1;
            const drainStartTime = drainStartTimeRef.current;
            if (drainStartTime !== null) {
                const taperProgress = clamp01((timeMs - drainStartTime) / BUBBLE_SPAWN_TAPER_MS);
                taperIntensity = Math.sin((Math.PI / 2) * (1 - taperProgress));

                if (taperProgress >= 1) {
                    spawnEnabledRef.current = false;
                    spawnCarryRef.current = 0;
                }
            }

            const spawnIntensity = rampIntensity * taperIntensity;
            const targetCount = Math.max(1, Math.round(targetBubbleCountRef.current * qualityScaleRef.current));
            const spawnPerSecond = targetCount * 1.35 * spawnIntensity;
            const maxCount = Math.round(targetCount * 1.2);
            const laneCounts = Array.from({ length: SPAWN_LANE_COUNT }, () => 0);
            for (let index = 0; index < bubblesRef.current.length; index += 1) {
                const bubble = bubblesRef.current[index];
                const laneRatio = width > 0 ? clamp01(bubble.x / width) : 0;
                const laneIndex = Math.min(SPAWN_LANE_COUNT - 1, Math.floor(laneRatio * SPAWN_LANE_COUNT));
                laneCounts[laneIndex] += 1;
            }

            spawnCarryRef.current += spawnPerSecond * frameDeltaSeconds;
            while (spawnCarryRef.current >= 1 && bubblesRef.current.length < maxCount) {
                const spawnRatio = getBalancedSpawnRatio(spawnIndexRef.current, laneCounts);
                bubblesRef.current.push(createBubble(width, timeMs, spawnRatio));
                spawnIndexRef.current += 1;
                spawnCarryRef.current -= 1;
            }
        }

        const bubbles = bubblesRef.current;
        let writeIndex = 0;
        for (let index = 0; index < bubbles.length; index += 1) {
            const bubble = bubbles[index];
            const travelSeconds = Math.max(0, (timeMs - bubble.bornAtMs) * 0.001);
            const y = height + bubble.radius - bubble.speed * travelSeconds;

            if (y > height + bubble.radius * 2 || y < -bubble.radius * 2) {
                continue;
            }

            bubbles[writeIndex] = bubble;
            writeIndex += 1;

            const wobble = Math.sin(timeMs * 0.001 * bubble.wobbleFreq + bubble.phase) * bubble.wobbleAmp;
            const x = bubble.x + wobble;
            const size = bubble.radius * 2;

            ctx.globalAlpha = bubble.alpha * (0.12 + coverage * 0.98);
            ctx.drawImage(sprite, x - bubble.radius, y - bubble.radius, size, size);
        }

        if (writeIndex !== bubbles.length) {
            bubbles.length = writeIndex;
        }

        if (modeRef.current === "revealing" && !spawnEnabledRef.current && bubbles.length === 0) {
            finalizeTransition();
            return;
        }

        ctx.globalAlpha = 1;
    }, [finalizeTransition]);

    const stopAnimation = useCallback(() => {
        if (rafIdRef.current !== null) {
            window.cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
    }, []);

    const startActiveAnimation = useCallback(() => {
        stopAnimation();

        const tick = (timestamp: number) => {
            if (modeRef.current === "idle") {
                rafIdRef.current = null;
                return;
            }
            drawFrame(timestamp);

            rafIdRef.current = window.requestAnimationFrame(tick);
        };

        rafIdRef.current = window.requestAnimationFrame(tick);
    }, [drawFrame, stopAnimation]);

    const animateCoverage = useCallback(
        (from: number, to: number, durationMs: number, onComplete: () => void) => {
            stopAnimation();
            let progress = 0;
            let lastTs = performance.now();

            const tick = (timestamp: number) => {
                const deltaMs = Math.min(timestamp - lastTs, 33);
                lastTs = timestamp;

                progress = clamp01(progress + deltaMs / durationMs);
                const eased = easeOutCubic(progress);

                coverageRef.current = from + (to - from) * eased;
                drawFrame(timestamp);

                if (progress < 1) {
                    rafIdRef.current = window.requestAnimationFrame(tick);
                    return;
                }

                rafIdRef.current = null;
                onComplete();
            };

            rafIdRef.current = window.requestAnimationFrame(tick);
        },
        [drawFrame, stopAnimation]
    );

    useEffect(() => {
        if (mode !== "idle") return;

        coverageRef.current = 0;
        lastFrameTimeRef.current = null;
        spawnCarryRef.current = 0;
        drawFrame(performance.now());
    }, [drawFrame, mode]);

    const resizeCanvas = useCallback(() => {
        const overlay = overlayRef.current;
        const canvas = canvasRef.current;
        if (!overlay || !canvas) return;

        const rect = overlay.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_CANVAS_DPR);

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);

        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctxRef.current = ctx;
        sizeRef.current = { width, height, dpr };
        targetBubbleCountRef.current = getBubbleFieldTargetCount(width, height);
        bubblesRef.current = [];
        smoothedFrameTimeMsRef.current = 16;
        qualityScaleRef.current = 1;
        spawnIndexRef.current = 0;
        drawFrame(performance.now());
    }, [drawFrame]);

    useEffect(() => {
        spriteRef.current = createBubbleSprite();
        resizeCanvas();

        const observer = new ResizeObserver(() => {
            resizeCanvas();
        });

        if (overlayRef.current) {
            observer.observe(overlayRef.current);
        }

        const handleResize = () => resizeCanvas();
        window.addEventListener("resize", handleResize);

        return () => {
            stopAnimation();
            if (navigationDelayIdRef.current !== null) {
                window.clearTimeout(navigationDelayIdRef.current);
                navigationDelayIdRef.current = null;
            }
            observer.disconnect();
            window.removeEventListener("resize", handleResize);
        };
    }, [resizeCanvas, stopAnimation]);

    const startTransition = useCallback(
        (href: string) => {
            if (href === pathname || mode !== "idle" || transitionLockRef.current) return;

            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                router.push(href);
                return;
            }

            transitionLockRef.current = true;
            pathAtStartRef.current = pathname;
            pendingHrefRef.current = href;
            transitionStartTimeRef.current = performance.now();
            if (navigationDelayIdRef.current !== null) {
                window.clearTimeout(navigationDelayIdRef.current);
                navigationDelayIdRef.current = null;
            }
            minCoverCompleteRef.current = false;
            routeReadyRef.current = false;
            drainingStartedRef.current = false;
            drainStartTimeRef.current = null;
            spawnEnabledRef.current = true;
            lastFrameTimeRef.current = null;
            smoothedFrameTimeMsRef.current = 16;
            qualityScaleRef.current = 1;
            spawnCarryRef.current = 0;
            spawnIndexRef.current = 0;
            const { width, height } = sizeRef.current;
            targetBubbleCountRef.current = getBubbleFieldTargetCount(width, height);
            bubblesRef.current = [];
            setMode("covering");
            navigationDelayIdRef.current = window.setTimeout(() => {
                const pendingHref = pendingHrefRef.current;
                if (!pendingHref) {
                    navigationDelayIdRef.current = null;
                    return;
                }

                router.push(pendingHref);
                navigationDelayIdRef.current = null;
            }, ROUTE_NAVIGATION_DELAY_MS);
            startActiveAnimation();

            animateCoverage(coverageRef.current, ROUTE_SWITCH_COVERAGE, COVER_DURATION_MS, () => {
                if (!pendingHrefRef.current) {
                    finalizeTransition();
                    return;
                }

                minCoverCompleteRef.current = true;
                coverageRef.current = Math.max(coverageRef.current, ROUTE_SWITCH_COVERAGE);
                drawFrame(performance.now());
                startActiveAnimation();
                if (!routeReadyRef.current) {
                    setMode("waiting-route");
                }
                beginDrainIfReady();
            });
        },
        [animateCoverage, beginDrainIfReady, drawFrame, finalizeTransition, mode, pathname, router, startActiveAnimation]
    );

    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    useEffect(() => {
        if (mode === "idle") return;
        if (pathname === pathAtStartRef.current) return;

        routeReadyRef.current = true;
        beginDrainIfReady();
    }, [pathname, beginDrainIfReady, mode]);

    const contextValue = useMemo<PageTransitionContextValue>(
        () => ({
            startTransition,
            isTransitioning: mode !== "idle",
        }),
        [mode, startTransition]
    );

    return (
        <PageTransitionContext.Provider value={contextValue}>
            {children}
            <div
                ref={overlayRef}
                aria-hidden="true"
                className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 ${mode === "idle" ? "opacity-0" : "opacity-100"}`}
                style={{ top: topOffset }}
            >
                <canvas ref={canvasRef} className="h-full w-full" />
            </div>
        </PageTransitionContext.Provider>
    );
}

export function usePageTransition() {
    const context = useContext(PageTransitionContext);
    if (!context) {
        throw new Error("usePageTransition must be used within PageTransitionProvider");
    }

    return context;
}

export function TransitionLink({ href, onClick, target, ...props }: TransitionLinkProps) {
    const { startTransition } = usePageTransition();

    const handleClick = useCallback(
        (event: MouseEvent<HTMLAnchorElement>) => {
            onClick?.(event);
            if (event.defaultPrevented) return;

            if (target && target !== "_self") return;
            if (event.button !== 0) return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            event.preventDefault();
            startTransition(href);
        },
        [href, onClick, startTransition, target]
    );

    return <Link {...props} href={href} target={target} onClick={handleClick} />;
}
