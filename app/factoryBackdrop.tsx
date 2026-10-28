"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createCircleBubbles } from "./backdropHelpers/bubbles";
import Logo from "./backdropHelpers/logo";
import Pipes, { createPipePaths } from "./backdropHelpers/pipes";
import type { AnchorPoint, CanvasSize, CircleMetrics } from "./backdropHelpers/types";
import { isHomeStacked, LAYOUT_FLAGS_EVENT } from "./home-layout";

type FactoryBackdropProps = {
  showFactoryEffects?: boolean;
  showLogoCircle?: boolean;
};

const INITIAL_VIEWPORT_SIZE: CanvasSize = { width: 1440, height: 900 };
// Pipe strokes were tuned for a 90px nav row (10dvh at 900px tall), where the flask is 90 * 10/7 across.
const PIPE_BASE_FLASK_DIAMETER = 90 * (10 / 7);
const INITIAL_NAV_HEIGHT = 90;
const LOGO_TOUCH_HOVER_MS = 1400;

function circleMetricsFromRect(rect: DOMRect): CircleMetrics {
  const diameter = rect.width;
  const radius = diameter / 2;

  return { diameter, radius, cx: rect.left + radius, cy: rect.top + radius, top: rect.top };
}

// Matches the CSS defaults (--rlg-flask-*) for a 1440x900 viewport, used until the navbar is measured.
function initialCircleMetrics(): CircleMetrics {
  const diameter = PIPE_BASE_FLASK_DIAMETER;
  const radius = diameter / 2;
  const top = INITIAL_NAV_HEIGHT / 15;

  return { diameter, radius, cx: INITIAL_VIEWPORT_SIZE.width / 2, cy: top + radius, top };
}

function useHydratedFlag(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function useOverlayGeometry(showFactoryEffects: boolean, showLogoCircle: boolean): {
  viewportSize: CanvasSize;
  circleMetrics: CircleMetrics;
  navBottom: number;
  cardAnchors: AnchorPoint[];
} {
  const [viewportSize, setViewportSize] = useState<CanvasSize>(INITIAL_VIEWPORT_SIZE);
  const [circleMetrics, setCircleMetrics] = useState<CircleMetrics>(initialCircleMetrics);
  const [navBottom, setNavBottom] = useState(INITIAL_NAV_HEIGHT);
  const [cardAnchors, setCardAnchors] = useState<AnchorPoint[]>([]);

  useEffect(() => {
    // Focus mode has no backdrop to measure or animate.
    if (!showFactoryEffects && !showLogoCircle) return;

    const flaskAnchor = document.querySelector<HTMLElement>("[data-rlg-flask='true']");
    const nav = document.querySelector<HTMLElement>("nav");
    const home = showFactoryEffects ? document.querySelector<HTMLElement>(".home-gamecards") : null;
    const cardNodes = home ? Array.from(home.querySelectorAll<HTMLElement>("[data-gamecard='true']")) : [];

    const updateOverlayGeometry = () => {
      frame = 0;
      const nextViewport = { width: window.innerWidth, height: window.innerHeight };
      setViewportSize(previous => previous.width === nextViewport.width && previous.height === nextViewport.height
        ? previous : nextViewport);

      // The navbar's home link is the flask's footprint; it is absent when the navbar is hidden (Rapid Path focus mode).
      if (flaskAnchor) {
        const next = circleMetricsFromRect(flaskAnchor.getBoundingClientRect());
        setCircleMetrics(previous => previous.diameter === next.diameter && previous.cx === next.cx && previous.cy === next.cy
          ? previous : next);
      }
      if (nav) {
        setNavBottom(nav.getBoundingClientRect().bottom);
      }

      // Stacked (portrait) home layout scrolls, so the home page draws its own pipes inside the scrolling content.
      if (!showFactoryEffects || isHomeStacked()) {
        setCardAnchors(previous => previous.length === 0 ? previous : []);
        return;
      }

      const nextAnchors = cardNodes.map((card) => {
        const rect = card.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top,
        };
      });

      setCardAnchors(previous => previous.length === nextAnchors.length && previous.every((anchor, index) =>
        anchor.x === nextAnchors[index].x && anchor.y === nextAnchors[index].y) ? previous : nextAnchors);
    };

    let frame = 0;

    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateOverlayGeometry);
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener(LAYOUT_FLAGS_EVENT, scheduleUpdate);

    // Observe layout inputs, never the SVG output. A body-wide mutation observer
    // feeds our own SVG updates back into another measurement/render cycle.
    const observer = new ResizeObserver(scheduleUpdate);
    for (const element of [nav, flaskAnchor, home, ...cardNodes]) {
      if (element) observer.observe(element);
    }

    return () => {
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener(LAYOUT_FLAGS_EVENT, scheduleUpdate);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [showFactoryEffects, showLogoCircle]);

  return { viewportSize, circleMetrics, navBottom, cardAnchors };
}

export default function FactoryBackdrop({
  showFactoryEffects = true,
  showLogoCircle = true,
}: FactoryBackdropProps) {
  const hasHydrated = useHydratedFlag();
  const { viewportSize, circleMetrics, navBottom, cardAnchors } = useOverlayGeometry(showFactoryEffects, showLogoCircle);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const pipeScale = circleMetrics.diameter / PIPE_BASE_FLASK_DIAMETER;

  useEffect(() => {
    if (!hasHydrated || !showLogoCircle) {
      return;
    }

    const hoverRadius = circleMetrics.radius * 1.04;
    const hoverRadiusSq = hoverRadius * hoverRadius;

    const syncHoverState = (clientX: number, clientY: number) => {
      const dx = clientX - circleMetrics.cx;
      const dy = clientY - circleMetrics.cy;
      const isHovered = dx * dx + dy * dy <= hoverRadiusSq;
      setIsLogoHovered((prev) => (prev === isHovered ? prev : isHovered));
    };

    // Pointer (not mouse) events, so a tap's emulated mouse events don't leave the flask stuck in its hover state.
    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      syncHoverState(event.clientX, event.clientY);
    };

    const handleMouseLeave = () => {
      setIsLogoHovered((prev) => (prev ? false : prev));
    };

    // Touch has no hover: a tap on the flask gives the same bubble surge for a moment.
    let touchHoverTimeout = 0;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      const dx = event.clientX - circleMetrics.cx;
      const dy = event.clientY - circleMetrics.cy;
      if (dx * dx + dy * dy > hoverRadiusSq) return;

      setIsLogoHovered(true);
      window.clearTimeout(touchHoverTimeout);
      touchHoverTimeout = window.setTimeout(() => setIsLogoHovered(false), LOGO_TOUCH_HOVER_MS);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.clearTimeout(touchHoverTimeout);
    };
  }, [circleMetrics.cx, circleMetrics.cy, circleMetrics.radius, hasHydrated, showLogoCircle]);

  const circleBubbles = useMemo(
    () => (hasHydrated && showLogoCircle
      ? createCircleBubbles(circleMetrics.diameter, {
        countMultiplier: isLogoHovered ? 1.5 : 0.58,
        speedMultiplier: isLogoHovered ? 5.0 : 1,
      })
      : []),
    [circleMetrics.diameter, hasHydrated, isLogoHovered, showLogoCircle],
  );

  const pipePaths = useMemo(() => {
    if (!hasHydrated || !showFactoryEffects || cardAnchors.length === 0) {
      return [];
    }

    return createPipePaths(cardAnchors, viewportSize, navBottom, circleMetrics.diameter * 0.7);
  }, [cardAnchors, circleMetrics.diameter, hasHydrated, navBottom, showFactoryEffects, viewportSize]);

  return (
    <>
      {showFactoryEffects && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[9] overflow-hidden">
          <Pipes viewportSize={viewportSize} pipePaths={pipePaths} pipeScale={pipeScale} />
        </div>
      )}

      {showLogoCircle && (
        <Logo circleMetrics={circleMetrics} bubbles={circleBubbles} isHovered={isLogoHovered} />
      )}
    </>
  );
}
