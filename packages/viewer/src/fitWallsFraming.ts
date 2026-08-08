/** Minimal wall footprint used for fit-to-walls framing. */
export type FitWallSegment = {
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  height: number;
};

export type WallsFitBounds = {
  cx: number;
  cy: number;
  maxH: number;
  /** Ortho half-height / 3D framing span (same formula as prior createViewport). */
  span: number;
};

export type Vec3 = { x: number; y: number; z: number };

export type PlanFitFraming = {
  position: Vec3;
  lookAt: Vec3;
  orthoHalfH: number;
};

export type PerspectiveFitFraming = {
  orbit: Vec3;
  eye: Vec3;
  up: Vec3;
  orthoHalfH: number;
};

/** AABB center + span for wall endpoints; `null` when there are no walls. */
export function computeWallsFitBounds(
  walls: readonly FitWallSegment[],
): WallsFitBounds | null {
  if (walls.length === 0) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let maxH = 2.7;
  for (const w of walls) {
    minX = Math.min(minX, w.p1.x, w.p2.x);
    maxX = Math.max(maxX, w.p1.x, w.p2.x);
    minY = Math.min(minY, w.p1.y, w.p2.y);
    maxY = Math.max(maxY, w.p1.y, w.p2.y);
    maxH = Math.max(maxH, w.height);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const span = Math.max(maxX - minX, maxY - minY, 2) * 0.7 + 2;
  return { cx, cy, maxH, span };
}

export function resolvePlanFitFraming(bounds: WallsFitBounds): PlanFitFraming {
  const { cx, cy, span } = bounds;
  return {
    position: { x: cx, y: cy, z: 40 },
    lookAt: { x: cx, y: cy, z: 0 },
    orthoHalfH: span,
  };
}

export function resolvePerspectiveFitFraming(
  bounds: WallsFitBounds,
): PerspectiveFitFraming {
  const { cx, cy, maxH, span } = bounds;
  return {
    orbit: { x: cx, y: cy, z: maxH * 0.35 },
    eye: { x: cx + span, y: cy - span * 1.2, z: span * 0.9 },
    up: { x: 0, y: 0, z: 1 },
    orthoHalfH: span,
  };
}
