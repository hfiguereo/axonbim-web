/** Shared primitives — no React / Three / DOM. */

export type Vec3 = { x: number; y: number; z: number };

export const EPS_LENGTH = 1e-6;
export const EPS_AREA = 1e-9;
export const MIN_WALL_LENGTH = 0.05;
export const MIN_THICKNESS = 0.05;
export const MIN_HEIGHT = 0.05;
export const SNAP_TOLERANCE = 0.05;

export function almostEqual(a: number, b: number, eps = EPS_LENGTH): boolean {
  return Math.abs(a - b) <= eps;
}
