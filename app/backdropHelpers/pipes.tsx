import { useId } from "react";
import type { AnchorPoint, CanvasSize, PipePath } from "./types";

type PipesProps = {
	viewportSize: CanvasSize;
	pipePaths: PipePath[];
	pipeScale: number;
};

export function createPipePaths(cardAnchors: AnchorPoint[], viewportSize: CanvasSize, navHeight: number): PipePath[] {
	if (cardAnchors.length === 0) {
		return [];
	}

	return cardAnchors.map((anchor, index) => {
		const startX = viewportSize.width / 2;
		const startY = navHeight;
		const controlY = Math.max(startY + navHeight * 0.6, anchor.y - navHeight * 0.6);
		const controlX = (startX + anchor.x) / 2;
		const endY = anchor.y + navHeight * 0.1;

		return {
			id: `pipe-${index}`,
			d: `M ${startX} ${startY} Q ${controlX} ${controlY} ${anchor.x} ${endY}`,
		};
	});
}

export default function Pipes({ viewportSize, pipePaths, pipeScale }: PipesProps) {
	const underShadowWidth = 30 * pipeScale;
	const idPrefix = useId().replace(/:/g, "");
	const glowFilterId = `${idPrefix}-pipe-under-glow`;
	const glowBlurAmount = 4 * pipeScale;
	const blackOutlineStrokeWidth = 30 * pipeScale;
	const glassEdgeStrokeWidth = 26 * pipeScale;
	const hollowCoreWidth = 22 * pipeScale;
	const flowStrokeWidth = 14 * pipeScale;

	return (
		<svg
			className="absolute inset-0 h-full w-full"
			viewBox={`0 0 ${viewportSize.width} ${viewportSize.height}`}
			preserveAspectRatio="none"
			role="presentation"
		>
			<defs>
				<filter
					id={glowFilterId}
					x={-viewportSize.width}
					y={-viewportSize.height}
					width={viewportSize.width * 3}
					height={viewportSize.height * 3}
					filterUnits="userSpaceOnUse"
				>
					<feGaussianBlur in="SourceGraphic" stdDeviation={glowBlurAmount} result="softGlow" />
					<feDropShadow
						in="softGlow"
						dx="0"
						dy="0"
						floodColor="var(--color-brand-orange)"
						floodOpacity="1"
					/>
				</filter>
			</defs>
			{pipePaths.map((pipe) => {
				const pipeEdgeMaskId = `${idPrefix}-${pipe.id}-edge-mask`;

				return (
					<g key={pipe.id}>
						<defs>
							<mask id={pipeEdgeMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width={viewportSize.width} height={viewportSize.height}>
								<path d={pipe.d} fill="none" stroke="white" strokeWidth={blackOutlineStrokeWidth} strokeLinecap="round" />
								<path d={pipe.d} fill="none" stroke="black" strokeWidth={hollowCoreWidth} strokeLinecap="round" />
							</mask>
						</defs>
						<path
							d={pipe.d}
							fill="none"
							stroke="var(--color-brand-orange)"
							strokeOpacity={1}
							strokeWidth={underShadowWidth}
							strokeLinecap="round"
							filter={`url(#${glowFilterId})`}
						/>
						<path
							d={pipe.d}
							fill="none"
							stroke="var(--color-brand-glow)"
							strokeWidth={flowStrokeWidth}
							strokeOpacity={0.8}
							strokeLinecap="round"
							className="pipe-flow"
						/>
						<path
							d={pipe.d}
							fill="none"
							stroke="rgba(0, 0, 0, 1)"
							strokeWidth={blackOutlineStrokeWidth}
							strokeLinecap="round"
							mask={`url(#${pipeEdgeMaskId})`}
						/>

						<path
							d={pipe.d}
							fill="none"
							stroke="rgba(255, 255, 255, 0.6)"
							strokeWidth={glassEdgeStrokeWidth}
							strokeLinecap="round"
							mask={`url(#${pipeEdgeMaskId})`}
						/>
					</g>
				);
			})}
		</svg>
	);
}
