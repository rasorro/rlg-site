import type { LiquidBubble } from "./types";

const LIQUID_BUBBLE_MIN = 0;
const LIQUID_BUBBLE_MAX = 2;
const LIQUID_BUBBLE_POSITION_COUNT = 16;
const LIQUID_BUBBLE_DURATION_MULTIPLIER = 2;
const CIRCLE_BUBBLE_DURATION_MULTIPLIER = 1.6;

type CircleBubbleOptions = {
	countMultiplier?: number;
	speedMultiplier?: number;
};

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function getRandomLiquidBubbleX(width: number, positionCount: number): number {
	const safePositionCount = Math.max(1, positionCount);
	const slotIndex = Math.floor(Math.random() * safePositionCount);
	const slotCenter = (slotIndex + 0.5) / safePositionCount;
	const slotWidth = width / safePositionCount;
	const slotJitter = (Math.random() - 0.5) * slotWidth * 0.45;

	return clamp(width * slotCenter + slotJitter, 0, width);
}

export function createLiquidBubbles(width: number, height: number): LiquidBubble[] {
	if (width <= 0 || height <= 0) {
		return [];
	}

	const area = width * height;
	const count = clamp(Math.round(area / 38000), LIQUID_BUBBLE_MIN, LIQUID_BUBBLE_MAX);
	const positionCount = Math.max(1, LIQUID_BUBBLE_POSITION_COUNT);

	return Array.from({ length: count }, (_, i) => {
		const cx = getRandomLiquidBubbleX(width, positionCount);
		const cy = height - 6 - (i % 5) * 8;
		const noise = Math.sin((i + 1) * 12.9898 + width * 0.001 + height * 0.002) * 43758.5453;
		const jitter = noise - Math.floor(noise);
		const r = Math.max(1, Math.min(50, height * 0.014 + 1.8 + jitter * 8.2));
		const rise = height + 34;
		const duration = (3.5 + (i % 6) * 0.35) * LIQUID_BUBBLE_DURATION_MULTIPLIER;
		const delay = -(i * 0.5);
		const drift = (i % 2 === 0 ? 1 : -1) * (3 + (i % 3) * 2);

		return {
			id: `liquid-bubble-${i}`,
			cx,
			cy,
			r,
			rise,
			duration,
			delay,
			drift,
		};
	});
}

export function rerollLiquidBubbleSpawnPosition(bubble: LiquidBubble, width: number): LiquidBubble {
	return {
		...bubble,
		cx: getRandomLiquidBubbleX(width, LIQUID_BUBBLE_POSITION_COUNT),
	};
}

export function createCircleBubbles(diameter: number, options: CircleBubbleOptions = {}): LiquidBubble[] {
	if (diameter <= 0) {
		return [];
	}

	const countMultiplier = options.countMultiplier ?? 1;
	const speedMultiplier = options.speedMultiplier ?? 1;

	const count = clamp(Math.round((diameter / 6) * countMultiplier), 8, 36);
	const radius = diameter / 2;

	return Array.from({ length: count }, (_, i) => {
		const seed = Math.sin((i + 1) * 13.87 + diameter * 0.03) * 43758.5453;
		const jitter = seed - Math.floor(seed);
		const sweep = Math.sin((i + 1) * 7.13) * 0.5 + 0.5;
		const cx = diameter * (0.22 + sweep * 0.56);
		const cy = radius * 1.62 - (i % 4) * 6;
		const r = clamp(diameter * (0.018 + jitter * 0.02), 1.5, 6.5);
		const rise = radius * 1.5;
		const duration = ((3 + (i % 5) * 0.4) * CIRCLE_BUBBLE_DURATION_MULTIPLIER) / Math.max(0.1, speedMultiplier);
		const delay = -(i * 0.45);
		const drift = (i % 2 === 0 ? 1 : -1) * (1.4 + (i % 3) * 1.3);

		return {
			id: `circle-bubble-${i}`,
			cx,
			cy,
			r,
			rise,
			duration,
			delay,
			drift,
		};
	});
}
