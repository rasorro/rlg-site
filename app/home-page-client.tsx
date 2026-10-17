"use client";

import Image from "next/image";
import { memo, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode, type RefObject } from "react";
import Pipes, { createStackedPipePaths } from "./backdropHelpers/pipes";
import type { CanvasSize, PipePath } from "./backdropHelpers/types";
import { HOME_STACKED_QUERY } from "./home-layout";
import { useHasFinePointer } from "./input-capabilities";
import { TransitionLink } from "./page-transition";
import { useTouchPress } from "./touch-press";

const GAME_CARD_SIZE = "var(--rlg-gamecard-size)", GAME_CARD_IMAGE_SIZES = "(max-width: 1024px) 40vw, 70rem", GAME_CARD_FONT_SIZE = "calc(var(--rlg-gamecard-size) / 24)", GAME_CARD_GAP = "clamp(1rem, 5vw, 6rem)", GAME_CARD_VAT_LAYER_SRC = "/optimized_assets/global_assets/rlg_layer_vat.webp", GAME_CARD_GLOW_LAYER_SRC = "/optimized_assets/global_assets/rlg_layer_glow.svg", GAME_CARD_METAL_LAYER_SRC = "/optimized_assets/global_assets/rlg_layer_metal.webp", GAME_CARD_VAT_LAYER_OPACITY = 0, VAT_BUBBLES_VISIBLE_COUNT = 18, VAT_LIQUID_BACKGROUND = "linear-gradient(to top, rgba(0, 255, 157, 0) 0%, rgba(255, 0, 153, 0) 35%)", VAT_GLASS_BACKGROUND = "linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.2) 28%, rgba(255, 255, 255, 0.15) 62%), radial-gradient(120% 75% at 50% -8%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.02) 68%)", CARD_ACTION_GLOSS = "linear-gradient(to bottom, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.15) 45%, rgba(255, 255, 255, 0))", VAT_BUBBLE_SPEED_MULTIPLIER_BASE = 1, VAT_BUBBLE_SPEED_MULTIPLIER_HOVER = 6, STACKED_PIPE_SCALE_CARD_SIZE = 420, CENTER_BAND_ROOT_MARGIN = "-45% 0px -45% 0px";

const CARD_GRID_STYLE = { "--rlg-gamecard-gap": GAME_CARD_GAP } as CSSProperties;
const GAME_CARD_ARTICLE_CLASS = "group relative aspect-square overflow-hidden", GAME_CARD_IMAGE_WINDOW_CLASS = "pointer-events-none absolute left-1/2 top-1/2 z-[2] h-[12em] w-[12em] -translate-x-1/2 -translate-y-[50%] overflow-hidden border-[0.2em] border-black bg-brand-background", GAME_CARD_FROST_LAYER_CLASS = "pointer-events-none absolute inset-y-0 h-full w-[83%] left-1/2 -translate-x-1/2 z-[1] rounded-[33%] backdrop-blur-[0.3em] bg-white/25", VAT_BUBBLE_LAYER_CLASS = "pointer-events-none absolute inset-y-0 left-1/2 z-[3] h-full w-[83%] -translate-x-1/2 overflow-hidden rounded-[33%]", VAT_LIQUID_LAYER_CLASS = "pointer-events-none absolute inset-y-0 left-1/2 z-[4] h-full w-[83%] -translate-x-1/2 rounded-[33%]", VAT_GLASS_LAYER_CLASS = "pointer-events-none absolute inset-y-0 h-full w-[83%] left-1/2 -translate-x-1/2 z-[5] rounded-[33%] border-[0.2em] border-white/30 ring-3 ring-black", VAT_GLOW_MASK_LAYER_CLASS = "pointer-events-none absolute inset-0 z-[6]", CARD_ACTION_BASE_CLASS = "translate-y-[-0.4em] relative inline-flex items-center justify-center overflow-hidden rounded-full border-3 border-white/40 ring-2 ring-black w-[8em] h-[1.5em] text-[1.75em] font-bold leading-none text-brand-text transition hover:bg-brand-glow active:bg-brand-glow data-[pressed=true]:bg-brand-glow";
const GLOW_MASK_BASE_STYLE = { opacity: 1, maskSize: "cover", maskPosition: "center", maskRepeat: "no-repeat", WebkitMaskSize: "cover", WebkitMaskRepeat: "no-repeat" } as const;

type VatBubble = { id: number; cx: number; cy: number; r: number; driftPx: number; durationSeconds: number; delaySeconds: number; risePx: number; opacity: number };
type GameCard = { title: string; href: string; imageSrc?: string; gameColor: string; isReady: boolean };
type CardActionProps = { isReady: boolean; href: string; onPlayHoverChange?: (isHovering: boolean) => void };
type VatBubbleLayerProps = { boosted: boolean; prefersReducedMotion: boolean };
type GameCardTileProps = { game: GameCard; index: number; prefersReducedMotion: boolean; isCentered: boolean };

const deterministicUnit = (seed: number) => {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
};
const randomBetween = (min: number, max: number, unit: number) => min + unit * (max - min);
const createVatBubble = (id: number): VatBubble => {
  const unit = (step: number) => deterministicUnit(id * 997 + step * 1013);
  return { id, cx: randomBetween(10, 90, unit(4)), cy: randomBetween(98, 106, unit(5)), r: randomBetween(1.2, 2.2, unit(1)), driftPx: randomBetween(-9, 9, unit(3)), durationSeconds: randomBetween(3.6, 6.2, unit(2)), delaySeconds: randomBetween(-6.2, 0, unit(6)), risePx: randomBetween(90, 122, unit(7)), opacity: randomBetween(0.44, 0.62, unit(8)) };
};

const STATIC_VAT_BUBBLES = Array.from({ length: VAT_BUBBLES_VISIBLE_COUNT }, (_, i) => createVatBubble(i + 1));
const GAMES: GameCard[] = [
  { title: "RAPID PATH", href: "/rapid-path", imageSrc: "/optimized_assets/game_assets/rapid-path/rapidPath.webp", gameColor: "var(--color-rapidPath)", isReady: true },
  { title: "STICKMAN SKYDIVE", href: "/stickman-skydive-simulator", imageSrc: "/optimized_assets/game_assets/stickman-skydive-simulator/stickmanSkydivePreview.webp", gameColor: "var(--color-stickman)", isReady: false },
  { title: "SWERVE", href: "/swerve", imageSrc: "/optimized_assets/game_assets/swerve/swervePreview.webp", gameColor: "var(--color-swerve)", isReady: false },
];

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);
    return () => mediaQuery.removeEventListener("change", syncPreference);
  }, []);
  return prefersReducedMotion;
}

const useHasHydrated = () => useSyncExternalStore(() => () => {}, () => true, () => false);

function CardAction({ isReady, href, onPlayHoverChange }: CardActionProps) {
  const label = isReady ? "Play" : "Coming Soon";
  const touchPressProps = useTouchPress(onPlayHoverChange);
  const actionChrome: ReactNode = <><span aria-hidden="true" className="pointer-events-none absolute inset-[0px] z-20 rounded-[9999px] bg-white opacity-[0.15]" /><span aria-hidden="true" className="pointer-events-none absolute inset-0 z-0" style={{ background: CARD_ACTION_GLOSS }} /><span className="engraved-title relative z-10 text-[0.9em]">{label}</span></>;
  return isReady ? (
    <TransitionLink href={href} className={`${CARD_ACTION_BASE_CLASS} bg-brand-button`} onMouseEnter={() => onPlayHoverChange?.(true)} onMouseLeave={() => onPlayHoverChange?.(false)} onFocus={() => onPlayHoverChange?.(true)} onBlur={() => onPlayHoverChange?.(false)} {...touchPressProps()}>
      {actionChrome}
    </TransitionLink>
  ) : (
    <span aria-disabled="true" className={`${CARD_ACTION_BASE_CLASS} bg-brand-background`} {...touchPressProps()}>{actionChrome}</span>
  );
}

function VatBubbleLayer({ boosted, prefersReducedMotion }: VatBubbleLayerProps) {
  const hasHydrated = useHasHydrated();
  if (!hasHydrated || prefersReducedMotion) return null;
  const speedMultiplier = boosted ? VAT_BUBBLE_SPEED_MULTIPLIER_HOVER : VAT_BUBBLE_SPEED_MULTIPLIER_BASE;
  return (
    <div aria-hidden className={VAT_BUBBLE_LAYER_CLASS}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" role="presentation">
        {STATIC_VAT_BUBBLES.map((bubble) => (
          <circle key={bubble.id} cx={bubble.cx} cy={bubble.cy} r={bubble.r} opacity={bubble.opacity} className="vat-bubble liquid-bubble-logo" style={{ "--bubble-rise": `${bubble.risePx}px`, "--bubble-drift": `${bubble.driftPx}px`, "--bubble-duration": `${bubble.durationSeconds / speedMultiplier}s`, "--bubble-delay": `${bubble.delaySeconds}s` } as CSSProperties} />
        ))}
      </svg>
    </div>
  );
}

const GameCardTile = memo(function GameCardTile({ game, index, prefersReducedMotion, isCentered }: GameCardTileProps) {
  const [isPlayHovered, setIsPlayHovered] = useState(false);
  return (
    <article data-gamecard="true" data-gamecard-index={index} className={GAME_CARD_ARTICLE_CLASS} style={{ width: GAME_CARD_SIZE, fontSize: GAME_CARD_FONT_SIZE, filter: `drop-shadow(0 0 0.5em ${game.gameColor})` }}>
      {GAME_CARD_VAT_LAYER_OPACITY > 0 ? <Image src={GAME_CARD_VAT_LAYER_SRC} alt="" fill aria-hidden className="pointer-events-none z-[1] select-none" style={{ opacity: GAME_CARD_VAT_LAYER_OPACITY }} sizes={GAME_CARD_IMAGE_SIZES} /> : null}
      <div aria-hidden className={GAME_CARD_FROST_LAYER_CLASS} />
      <div aria-hidden className={GAME_CARD_IMAGE_WINDOW_CLASS}>{game.imageSrc ? <Image src={game.imageSrc} alt={game.title} fill className="pointer-events-none z-[1] select-none object-cover" sizes={GAME_CARD_IMAGE_SIZES} /> : <div className="h-full w-full bg-brand-background" />}</div>
      <VatBubbleLayer boosted={(game.isReady && isPlayHovered) || isCentered} prefersReducedMotion={prefersReducedMotion} />
      <div aria-hidden className={VAT_LIQUID_LAYER_CLASS} style={{ background: VAT_LIQUID_BACKGROUND }} />
      <div aria-hidden className={VAT_GLASS_LAYER_CLASS} style={{ background: VAT_GLASS_BACKGROUND }} />
      <div aria-hidden className={VAT_GLOW_MASK_LAYER_CLASS} style={{ backgroundColor: game.gameColor, maskImage: `url('${GAME_CARD_GLOW_LAYER_SRC}')`, WebkitMaskImage: `url('${GAME_CARD_GLOW_LAYER_SRC}')`, ...GLOW_MASK_BASE_STYLE }} />
      <Image src={GAME_CARD_METAL_LAYER_SRC} alt="" fill aria-hidden className="pointer-events-none z-[7] select-none" sizes={GAME_CARD_IMAGE_SIZES} loading={index === 0 ? "eager" : "lazy"} />
      <div className="relative z-[20] flex h-full flex-col items-center justify-center gap-[16.65em]"><div className="flex h-[3.5em] items-center justify-center bg-brand-background w-[14em] border-[0.2em] border-black"><h2 className="engraved-title text-center text-[1.5em] leading-[0.9] font-bold">{game.title}</h2></div><CardAction isReady={game.isReady} href={game.href} onPlayHoverChange={setIsPlayHovered} /></div>
    </article>
  );
});

function useIsHomeStacked() {
  return useSyncExternalStore(
    (onChange) => {
      const mediaQuery = window.matchMedia(HOME_STACKED_QUERY);
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    },
    () => window.matchMedia(HOME_STACKED_QUERY).matches,
    () => false,
  );
}

// Pipes for the stacked layout live inside the scrolling page (unlike the fixed desktop overlay) so they move with the cards.
function StackedPipes({ containerRef }: { containerRef: RefObject<HTMLElement | null> }) {
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const [pipePaths, setPipePaths] = useState<PipePath[]>([]);
  const [pipeScale, setPipeScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const origin = container.getBoundingClientRect();
      const cards = Array.from(container.querySelectorAll<HTMLElement>("[data-gamecard='true']")).map((card) => {
        const rect = card.getBoundingClientRect();
        return { cx: rect.left - origin.left + rect.width / 2, top: rect.top - origin.top, bottom: rect.bottom - origin.top, size: rect.width };
      });
      setCanvasSize({ width: origin.width, height: origin.height });
      setPipePaths(createStackedPipePaths(cards, origin.width));
      setPipeScale(cards.length > 0 ? cards[0].size / STACKED_PIPE_SCALE_CARD_SIZE : 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  if (canvasSize.width === 0) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <Pipes viewportSize={canvasSize} pipePaths={pipePaths} pipeScale={pipeScale} />
    </div>
  );
}

// Touch has no hover, so on touch-only devices the stacked vat crossing the middle of the screen gets the hover bubble boost instead.
function useCenteredCardIndex(containerRef: RefObject<HTMLElement | null>, enabled: boolean): number | null {
  const [centeredIndex, setCenteredIndex] = useState<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCenteredIndex(Number(entry.target.getAttribute("data-gamecard-index")));
        }
      },
      { rootMargin: CENTER_BAND_ROOT_MARGIN },
    );
    container.querySelectorAll("[data-gamecard='true']").forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [containerRef, enabled]);

  return enabled ? centeredIndex : null;
}

export default function HomePageClient() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isStacked = useIsHomeStacked();
  const isTouchOnly = useHasFinePointer() === false;
  const mainRef = useRef<HTMLElement | null>(null);
  const centeredIndex = useCenteredCardIndex(mainRef, isStacked && isTouchOnly);
  return (
    <main ref={mainRef} className="home-gamecards relative z-[10] shrink-0 overflow-visible pt-[var(--rlg-home-top-pad)] text-brand-button home-stacked:pb-16">
      {isStacked && <StackedPipes containerRef={mainRef} />}
      <div className="relative z-[1] w-full px-[var(--rlg-gamecard-gap)]" style={CARD_GRID_STYLE}>
        <section>
          <div className="grid grid-cols-3 justify-items-center gap-x-[var(--rlg-gamecard-gap)] home-stacked:flex home-stacked:flex-col home-stacked:gap-y-8">
            {GAMES.map((game, index) => (
              <div key={game.title} className="flex justify-center home-stacked:w-full home-stacked:odd:justify-start home-stacked:even:justify-end">
                <GameCardTile game={game} index={index} prefersReducedMotion={prefersReducedMotion} isCentered={centeredIndex === index} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
