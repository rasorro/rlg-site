import { memo, useMemo, type CSSProperties } from "react";
import type { CircleMetrics, LiquidBubble } from "./types";

type LogoProps = {
	circleMetrics: CircleMetrics;
	bubbles: LiquidBubble[];
	isHovered: boolean;
};

function Logo({ circleMetrics, bubbles, isHovered }: LogoProps) {
	const baseFillColor = isHovered ? "var(--color-brand-glow)" : "var(--color-brand-button)";

	const logoImageGeometry = useMemo(() => {
		const size = circleMetrics.diameter * 0.64;
		const x = circleMetrics.diameter * 0.18;
		const y = circleMetrics.diameter * 0.18;

		return { size, x, y };
	}, [circleMetrics.diameter]);

	return (
		<div
			aria-hidden
			className="pointer-events-none absolute left-1/2 z-[50] -translate-x-1/2 overflow-visible"
			style={{ top: `${circleMetrics.top}px`, width: `${circleMetrics.diameter}px`, height: `${circleMetrics.diameter}px` }}
		>
			<svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${circleMetrics.diameter} ${circleMetrics.diameter}`} role="presentation">
				<defs>
					<clipPath id="liquid-logo-circle-clip">
						<circle cx={circleMetrics.radius} cy={circleMetrics.radius} r={circleMetrics.radius - 3} />
					</clipPath>
					<linearGradient id="liquid-logo-highlight" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="rgba(255, 255, 255, 0.05)" />
						<stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
					</linearGradient>
					<filter id="liquid-logo-image-glow" x="-60%" y="-60%" width="220%" height="220%">
						<feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="blur" />
						<feColorMatrix
							in="blur"
							type="matrix"
							values="0 0 0 0 0
							        0 0 0 0 1
							        0 0 0 0 0.32
							        0 0 0 1.15 0"
							result="glow"
						/>
						<feComposite in="glow" in2="SourceAlpha" operator="out" />
					</filter>
					<filter id="liquid-logo-ring-glow" x="-120%" y="-120%" width="340%" height="340%">
						<feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="ringBlur" />
						<feColorMatrix
							in="ringBlur"
							type="matrix"
							values="0 0 0 0 0
							        0 0 0 0 1
							        0 0 0 0 0.2
							        0 0 0 0.85 0"
						/>
					</filter>
				</defs>

				<circle cx={circleMetrics.radius} cy={circleMetrics.radius} r={circleMetrics.radius - 2} fill={baseFillColor} fillOpacity="1" />
				<g clipPath="url(#liquid-logo-circle-clip)">
					<image
						href="/optimized_assets/global_assets/rlg_Logo.webp"
						x={logoImageGeometry.x}
						y={logoImageGeometry.y}
						width={logoImageGeometry.size}
						height={logoImageGeometry.size}
						preserveAspectRatio="xMidYMid meet"
						filter="url(#liquid-logo-image-glow)"
						className="logo-image-glow-pulse"
						opacity="0.82"
						style={{ willChange: "opacity" }}
					/>
					<image
						href="/optimized_assets/global_assets/rlg_Logo.webp"
						x={logoImageGeometry.x}
						y={logoImageGeometry.y}
						width={logoImageGeometry.size}
						height={logoImageGeometry.size}
						preserveAspectRatio="xMidYMid meet"
					/>
					<circle cx={circleMetrics.radius} cy={circleMetrics.radius} r={circleMetrics.radius - 3} fill="rgba(255, 255, 255, 0.2)" />
					<circle cx={circleMetrics.radius} cy={circleMetrics.radius} r={circleMetrics.radius - 3} fill="url(#liquid-logo-highlight)" fillOpacity="0.8" />
					{bubbles.map((bubble) => {
						const bubbleStyle = {
							"--bubble-rise": `${bubble.rise}px`,
							"--bubble-drift": `${bubble.drift}px`,
							"--bubble-duration": `${bubble.duration}s`,
							"--bubble-delay": `${bubble.delay}s`,
						} as CSSProperties;

						return (
							<circle
								key={bubble.id}
								cx={bubble.cx}
								cy={bubble.cy}
								r={bubble.r}
								className="liquid-bubble liquid-bubble-logo"
								style={bubbleStyle}
							/>
						);
					})}
				</g>

				<circle
					cx={circleMetrics.radius}
					cy={circleMetrics.radius}
					r={circleMetrics.radius}
					fill="none"
					stroke="var(--color-brand-glow)"
					strokeWidth="4"
					filter="url(#liquid-logo-ring-glow)"
				/>
				<circle cx={circleMetrics.radius} cy={circleMetrics.radius} r={circleMetrics.radius - 2.5} fill="none" stroke="rgba(0,0,0,0.86)" strokeWidth="3" />
				<circle cx={circleMetrics.radius} cy={circleMetrics.radius} r={circleMetrics.radius - 6} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="2" />
			</svg>
		</div>
	);
}

export default memo(Logo);
