/**
 * Constrained edit of a storey wall footprint (axis-aligned rectangle in U/N).
 * One corner drag updates length and/or thickness without breaking invertibility.
 */

import { MIN_THICKNESS, MIN_WALL_LENGTH, type Vec3 } from "@axonbim/shared";

export type Vec2 = { x: number; y: number };

/**
 * Move corner `cornerIndex` of a 4-point closed footprint ring.
 * Sides stay parallel to `axisU` and its left normal.
 * Returns new ring (length 4) or null.
 */
export function moveFootprintCornerConstrained(
  corners: Vec3[],
  cornerIndex: number,
  to: Vec3,
  axisU: Vec2,
): Vec3[] | null {
  if (corners.length !== 4) return null;
  if (cornerIndex < 0 || cornerIndex >= 4) return null;
  const uLen = Math.hypot(axisU.x, axisU.y);
  if (uLen < 1e-12) return null;
  const ux = axisU.x / uLen;
  const uy = axisU.y / uLen;
  const nx = -uy;
  const ny = ux;
  const z = corners[0]!.z;

  const origin = corners[0]!;
  const toUV = (p: Vec3) => ({
    u: (p.x - origin.x) * ux + (p.y - origin.y) * uy,
    v: (p.x - origin.x) * nx + (p.y - origin.y) * ny,
  });
  const fromUV = (u: number, v: number): Vec3 => ({
    x: origin.x + u * ux + v * nx,
    y: origin.y + u * uy + v * ny,
    z,
  });

  const uvs = corners.map(toUV);
  let uMin = Math.min(...uvs.map((c) => c.u));
  let uMax = Math.max(...uvs.map((c) => c.u));
  let vMin = Math.min(...uvs.map((c) => c.v));
  let vMax = Math.max(...uvs.map((c) => c.v));

  const cur = uvs[cornerIndex]!;
  const midU = (uMin + uMax) / 2;
  const midV = (vMin + vMax) / 2;
  const atUMax = cur.u >= midU;
  const atVMax = cur.v >= midV;

  const t = toUV(to);
  if (atUMax) uMax = t.u;
  else uMin = t.u;
  if (atVMax) vMax = t.v;
  else vMin = t.v;

  if (uMax - uMin < MIN_WALL_LENGTH) {
    if (atUMax) uMax = uMin + MIN_WALL_LENGTH;
    else uMin = uMax - MIN_WALL_LENGTH;
  }
  if (vMax - vMin < MIN_THICKNESS) {
    if (atVMax) vMax = vMin + MIN_THICKNESS;
    else vMin = vMax - MIN_THICKNESS;
  }

  // Rebuild each corner keeping its (uExtreme, vExtreme) role.
  return uvs.map((c) => {
    const u = c.u >= midU ? uMax : uMin;
    const v = c.v >= midV ? vMax : vMin;
    return fromUV(u, v);
  });
}

/** Rebuild closed 4-edge ring as edge list (for profileFromClosedRing). */
export function footprintCornersToEdges(corners: Vec3[]): {
  p1: Vec3;
  p2: Vec3;
}[] {
  const n = corners.length;
  const edges: { p1: Vec3; p2: Vec3 }[] = [];
  for (let i = 0; i < n; i++) {
    const a = corners[i]!;
    const b = corners[(i + 1) % n]!;
    edges.push({
      p1: { x: a.x, y: a.y, z: a.z },
      p2: { x: b.x, y: b.y, z: b.z },
    });
  }
  return edges;
}
