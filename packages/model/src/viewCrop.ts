import type { ViewCrop } from "./types.js";
import type { Vec3 } from "@axonbim/shared";

const MIN_CROP_SIZE = 0.5;
const DEFAULT_DISTANCE = 8;
const DEFAULT_ASPECT = 16 / 9;

export function cloneViewCrop(crop: ViewCrop): ViewCrop {
  return {
    enabled: crop.enabled,
    minX: crop.minX,
    minY: crop.minY,
    maxX: crop.maxX,
    maxY: crop.maxY,
    ...(crop.minZ !== undefined ? { minZ: crop.minZ } : {}),
    ...(crop.maxZ !== undefined ? { maxZ: crop.maxZ } : {}),
  };
}

/** Ensure min < max and minimum size; returns a normalized copy. */
export function normalizeViewCrop(crop: ViewCrop): ViewCrop {
  let { minX, minY, maxX, maxY } = crop;
  if (minX > maxX) [minX, maxX] = [maxX, minX];
  if (minY > maxY) [minY, maxY] = [maxY, minY];
  if (maxX - minX < MIN_CROP_SIZE) {
    const cx = (minX + maxX) / 2;
    minX = cx - MIN_CROP_SIZE / 2;
    maxX = cx + MIN_CROP_SIZE / 2;
  }
  if (maxY - minY < MIN_CROP_SIZE) {
    const cy = (minY + maxY) / 2;
    minY = cy - MIN_CROP_SIZE / 2;
    maxY = cy + MIN_CROP_SIZE / 2;
  }
  let minZ = crop.minZ;
  let maxZ = crop.maxZ;
  if (minZ !== undefined && maxZ !== undefined && minZ > maxZ) {
    [minZ, maxZ] = [maxZ, minZ];
  }
  return {
    enabled: crop.enabled,
    minX,
    minY,
    maxX,
    maxY,
    ...(minZ !== undefined ? { minZ } : {}),
    ...(maxZ !== undefined ? { maxZ } : {}),
  };
}

/**
 * Default crop: AABB of the horizontal FOV footprint ~distance ahead of the eye.
 */
export function defaultCameraCrop(
  eye: Vec3,
  target: Vec3,
  fovDeg: number,
  distance = DEFAULT_DISTANCE,
): ViewCrop {
  const dx = target.x - eye.x;
  const dy = target.y - eye.y;
  const len = Math.hypot(dx, dy) || 1;
  const fx = dx / len;
  const fy = dy / len;
  const px = -fy;
  const py = fx;
  const vFov = (Math.min(120, Math.max(10, fovDeg)) * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * DEFAULT_ASPECT);
  const halfW = distance * Math.tan(hFov / 2);
  const tipX = eye.x;
  const tipY = eye.y;
  const baseX = eye.x + fx * distance;
  const baseY = eye.y + fy * distance;
  const c1x = baseX + px * halfW;
  const c1y = baseY + py * halfW;
  const c2x = baseX - px * halfW;
  const c2y = baseY - py * halfW;
  const xs = [tipX, c1x, c2x];
  const ys = [tipY, c1y, c2y];
  return normalizeViewCrop({
    enabled: true,
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  });
}

export function viewCropWidth(crop: ViewCrop): number {
  return crop.maxX - crop.minX;
}

export function viewCropDepth(crop: ViewCrop): number {
  return crop.maxY - crop.minY;
}

/** Resize crop by moving one corner; opposite corner stays fixed. */
export function resizeViewCropCorner(
  crop: ViewCrop,
  corner: 0 | 1 | 2 | 3,
  x: number,
  y: number,
): ViewCrop {
  // 0=SW(minX,minY) 1=SE(maxX,minY) 2=NE(maxX,maxY) 3=NW(minX,maxY)
  let { minX, minY, maxX, maxY } = crop;
  switch (corner) {
    case 0:
      minX = x;
      minY = y;
      break;
    case 1:
      maxX = x;
      minY = y;
      break;
    case 2:
      maxX = x;
      maxY = y;
      break;
    case 3:
      minX = x;
      maxY = y;
      break;
  }
  return normalizeViewCrop({
    ...crop,
    minX,
    minY,
    maxX,
    maxY,
  });
}

/** Line-strip positions for plan crop rectangle (closed). */
export function viewCropPlanLines(crop: ViewCrop, z = 0.03): Float32Array {
  const { minX, minY, maxX, maxY } = crop;
  return new Float32Array([
    minX, minY, z, maxX, minY, z,
    maxX, minY, z, maxX, maxY, z,
    maxX, maxY, z, minX, maxY, z,
    minX, maxY, z, minX, minY, z,
  ]);
}

export type CropCorner = 0 | 1 | 2 | 3;

export function viewCropCorners(
  crop: ViewCrop,
  z = 0.04,
): Array<{ corner: CropCorner; x: number; y: number; z: number }> {
  return [
    { corner: 0, x: crop.minX, y: crop.minY, z },
    { corner: 1, x: crop.maxX, y: crop.minY, z },
    { corner: 2, x: crop.maxX, y: crop.maxY, z },
    { corner: 3, x: crop.minX, y: crop.maxY, z },
  ];
}
