"use client";

import { useEffect, useMemo, useState } from "react";
import { createCircleBubbles } from "./backdropHelpers/bubbles";
import Logo from "./backdropHelpers/logo";
import Pipes, { createPipePaths } from "./backdropHelpers/pipes";
import type { AnchorPoint, CanvasSize, CircleMetrics } from "./backdropHelpers/types";

type FactoryBackdropProps = {
  showFactoryEffects?: boolean;
  showLogoCircle?: boolean;
};

const INITIAL_CANVAS_SIZE: CanvasSize = { width: 1200, height: 600 };
const INITIAL_VIEWPORT_SIZE: CanvasSize = { width: 1440, height: 900 };
const PIPE_BASE_VIEWPORT_HEIGHT = 900;
const NAVBAR_HEIGHT_RATIO = 0.1;
const LOGO_DIAMETER_TO_NAV_RATIO = 10 / 7;
const LOGO_TOP_TO_NAV_RATIO = 1 / 15;

function roundRectValue(value: number): number {
  return Math.round(value);
}


function computeCircleMetrics(viewportWidth: number, viewportHeight: number): CircleMetrics {
  const navHeight = viewportHeight * NAVBAR_HEIGHT_RATIO;
  const diameter = navHeight * LOGO_DIAMETER_TO_NAV_RATIO;
  const radius = diameter / 2;
  const top = navHeight * LOGO_TOP_TO_NAV_RATIO;
  const cx = viewportWidth / 2;
  const cy = top + radius;

  return { diameter, radius, cx, cy, top };
}

function useHydratedFlag(): boolean {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
}

function useOverlayGeometry(showFactoryEffects: boolean): {
  viewportSize: CanvasSize;
  circleMetrics: CircleMetrics;
  cardAnchors: AnchorPoint[];
} {
  const [viewportSize, setViewportSize] = useState<CanvasSize>(INITIAL_VIEWPORT_SIZE);
  const [circleMetrics, setCircleMetrics] = useState<CircleMetrics>(() =>
    computeCircleMetrics(INITIAL_VIEWPORT_SIZE.width, INITIAL_VIEWPORT_SIZE.height),
  );
  const [cardAnchors, setCardAnchors] = useState<AnchorPoint[]>([]);

  useEffect(() => {
    const updateOverlayGeometry = () => {
      const nextViewport = { width: window.innerWidth, height: window.innerHeight };
      setViewportSize(nextViewport);
      setCircleMetrics(computeCircleMetrics(nextViewport.width, nextViewport.height));

      if (!showFactoryEffects) {
        setCardAnchors([]);
        return;
      }

      const cardNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-gamecard='true']"));
      const nextAnchors = cardNodes.map((card) => {
        const rect = card.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top,
        };
      });

      setCardAnchors(nextAnchors);
    };

    let frame = 0;

    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateOverlayGeometry);
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);

    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true });

    return () => {
      window.removeEventListener("resize", scheduleUpdate);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [showFactoryEffects]);

  return { viewportSize, circleMetrics, cardAnchors };
}

export default function FactoryBackdrop({
  showFactoryEffects = true,
  showLogoCircle = true,
}: FactoryBackdropProps) {
  const hasHydrated = useHydratedFlag();
  const { viewportSize, circleMetrics, cardAnchors } = useOverlayGeometry(showFactoryEffects);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const navHeight = viewportSize.height * NAVBAR_HEIGHT_RATIO;
  const pipeScale = viewportSize.height / PIPE_BASE_VIEWPORT_HEIGHT;

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

    const handleMouseMove = (event: MouseEvent) => {
      syncHoverState(event.clientX, event.clientY);
    };

    const handleMouseLeave = () => {
      setIsLogoHovered((prev) => (prev ? false : prev));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
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

    return createPipePaths(cardAnchors, viewportSize, navHeight);
  }, [cardAnchors, hasHydrated, navHeight, showFactoryEffects, viewportSize]);

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
