import { MIN_WALL_LENGTH } from "@axonbim/shared";

export type SketchPoint = { x: number; y: number; z: number };

export type RectWallAxis = {
  p1: SketchPoint;
  p2: SketchPoint;
};

/**
 * SK-v1 — axis-aligned rectangle on the workplane from two opposite corners.
 * Returns four wall axes (CCW). Empty if either side is below MIN_WALL_LENGTH.
 */
export function wallAxesFromRectangle(
  a: SketchPoint,
  b: SketchPoint,
): RectWallAxis[] {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  const z = a.z;
  if (maxX - minX < MIN_WALL_LENGTH || maxY - minY < MIN_WALL_LENGTH) {
    return [];
  }
  const c00 = { x: minX, y: minY, z };
  const c10 = { x: maxX, y: minY, z };
  const c11 = { x: maxX, y: maxY, z };
  const c01 = { x: minX, y: maxY, z };
  return [
    { p1: c00, p2: c10 },
    { p1: c10, p2: c11 },
    { p1: c11, p2: c01 },
    { p1: c01, p2: c00 },
  ];
}

/** Four corners CCW for preview (closed loop = repeat first). */
export function rectangleCorners(a: SketchPoint, b: SketchPoint): SketchPoint[] {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  const z = a.z;
  return [
    { x: minX, y: minY, z },
    { x: maxX, y: minY, z },
    { x: maxX, y: maxY, z },
    { x: minX, y: maxY, z },
  ];
}
