import type { CSSProperties } from "react";
import type { CircleMetrics, LiquidBubble } from "./types";

type LogoProps = {
	circleMetrics: CircleMetrics;
	bubbles: LiquidBubble[];
};

export default function Logo({ circleMetrics, bubbles }: LogoProps) {
	return (
		<div
			aria-hidden
			className="pointer-events-none absolute left-1/2 z-[50] -translate-x-1/2"
			style={{ top: `${circleMetrics.top}px`, width: `${circleMetrics.diameter}px`, height: `${circleMetrics.diameter}px` }}
		>
			<svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${circleMetrics.diameter} ${circleMetrics.diameter}`} role="presentation">
				<defs>
					<clipPath id="liquid-logo-circle-clip">
						<circle cx={circleMetrics.radius} cy={circleMetrics.radius} r={circleMetrics.radius - 3} />
					</clipPath>
					<linearGradient id="liquid-logo-highlight" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="rgba(255, 255, 255, 0.35)" />
						<stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
					</linearGradient>
				</defs>

				<circle cx={circleMetrics.radius} cy={circleMetrics.radius} r={circleMetrics.radius - 2} fill="var(--color-brand-orange)" fillOpacity="1" />
				<g clipPath="url(#liquid-logo-circle-clip)">
					<image
						href="/rlg_Logo.png"
						x={circleMetrics.diameter * 0.18}
						y={circleMetrics.diameter * 0.18}
						width={circleMetrics.diameter * 0.64}
						height={circleMetrics.diameter * 0.64}
						preserveAspectRatio="xMidYMid meet"
					/>
					<circle cx={circleMetrics.radius} cy={circleMetrics.radius} r={circleMetrics.radius - 3} fill="rgba(255, 255, 255, 0.15)" />
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

				<circle cx={circleMetrics.radius} cy={circleMetrics.radius} r={circleMetrics.radius - 2.5} fill="none" stroke="rgba(0,0,0,0.86)" strokeWidth="3" />
				<circle cx={circleMetrics.radius} cy={circleMetrics.radius} r={circleMetrics.radius - 6} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="2" />
			</svg>
		</div>
	);
}
