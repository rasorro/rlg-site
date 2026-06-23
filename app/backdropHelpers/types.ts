export type CanvasSize = {
  width: number;
  height: number;
};

export type LiquidBubble = {
  id: string;
  cx: number;
  cy: number;
  r: number;
  rise: number;
  duration: number;
  delay: number;
  drift: number;
};

export type AnchorPoint = {
  x: number;
  y: number;
};

export type CircleMetrics = {
  diameter: number;
  radius: number;
  cx: number;
  cy: number;
  top: number;
};

export type PipePath = {
  id: string;
  d: string;
};
