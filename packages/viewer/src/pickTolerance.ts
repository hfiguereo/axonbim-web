/**
 * Screen-space picking tolerance (zoom-independent selection).
 *
 * Selection must stay reachable at any zoom, so thresholds and plan grip radii
 * are expressed in screen pixels and converted to world units here. Changing a
 * constant in this file changes what the user can click.
 */

/** Raycaster Line/Points threshold, in screen pixels. */
export const PICK_LINE_THRESHOLD_PX = 10;
/** Floor so the threshold never collapses when zoomed far in. */
export const MIN_PICK_LINE_THRESHOLD = 0.08;

/** Perspective pivot distance floor (avoids divide-by-near-zero framing). */
export const MIN_PIVOT_DISTANCE = 0.5;

/** Screen-proximity fallbacks when the ray misses thin geometry. */
export const ENTITY_PROXIMITY_PX = 14;
export const CROP_GRIP_PROXIMITY_PX = 14;
/**
 * The crop frame is the control the user reaches for to compose a presentation
 * (ADR 0016), and it is thin line geometry, so it gets the most generous
 * tolerance rather than the tightest. Raised from 12 px by owner decision
 * 2026-08-08.
 */
export const CROP_FRAME_PROXIMITY_PX = 16;
export const FLIP_CONTROL_PROXIMITY_PX = 16;

/** Plan grip sizes in pixels, with world-unit floors / ceilings. */
export const CROP_GRIP_RADIUS_PX = 10;
export const MIN_CROP_GRIP_RADIUS = 0.12;
export const FLIP_CONTROL_RADIUS_PX = 12;
/**
 * Cap so swing/hinge dots stay door-scale when zoomed far out.
 * Pickability still uses FLIP_CONTROL_PROXIMITY_PX (screen space).
 */
export const MAX_FLIP_CONTROL_RADIUS = 0.18;
export const CAMERA_PICK_RADIUS_PX = 14;
export const MIN_CAMERA_PICK_RADIUS = 0.25;

/** World units spanned by one screen pixel in an orthographic view. */
export function orthoWorldPerPixel(
  orthoHalfH: number,
  viewportHeight: number,
): number {
  return (orthoHalfH * 2) / Math.max(viewportHeight, 1);
}

/** World units spanned by one screen pixel at the pivot of a perspective view. */
export function perspectiveWorldPerPixel(
  pivotDistance: number,
  fovDeg: number,
  viewportHeight: number,
): number {
  const dist = Math.max(MIN_PIVOT_DISTANCE, pivotDistance);
  const vFov = (fovDeg * Math.PI) / 180;
  return (2 * dist * Math.tan(vFov / 2)) / Math.max(viewportHeight, 1);
}

/** Raycaster threshold for lines/points at the current zoom. */
export function pickLineThreshold(worldPerPixel: number): number {
  return Math.max(
    MIN_PICK_LINE_THRESHOLD,
    worldPerPixel * PICK_LINE_THRESHOLD_PX,
  );
}

/**
 * Grip radius that keeps a constant apparent size on screen, never smaller
 * than `minRadius` world units. Optional `maxRadius` stops runaway growth
 * when zoomed far out (BUG-D4: flip dots).
 */
export function screenScaledRadius(
  worldPerPixel: number,
  radiusPx: number,
  minRadius: number,
  maxRadius?: number,
): number {
  const r = Math.max(minRadius, worldPerPixel * radiusPx);
  return maxRadius === undefined ? r : Math.min(maxRadius, r);
}
