/**
 * Camera view navigation lock (ADR 0015 add-on):
 * locked by default; double-click inside the screen crop matte unlocks zoom/orbit.
 */

/** Matches `.viewport__crop-frame { inset: 8% }` when crop is shown. */
export const CAMERA_VIEW_CROP_INSET = 0.08;

/**
 * Whether a host-local point lies inside the camera/3D crop screen matte.
 * When crop is disabled, the whole host counts as the "frame".
 */
export function isInsideCameraViewFrame(
  localX: number,
  localY: number,
  hostWidth: number,
  hostHeight: number,
  cropFrameVisible: boolean,
  inset = CAMERA_VIEW_CROP_INSET,
): boolean {
  if (hostWidth <= 0 || hostHeight <= 0) return false;
  if (!cropFrameVisible) {
    return localX >= 0 && localX <= hostWidth && localY >= 0 && localY <= hostHeight;
  }
  const x0 = hostWidth * inset;
  const y0 = hostHeight * inset;
  const x1 = hostWidth * (1 - inset);
  const y1 = hostHeight * (1 - inset);
  return localX >= x0 && localX <= x1 && localY >= y0 && localY <= y1;
}
