import { SNAP_TOLERANCE, almostEqual, type Vec3 } from "@axonbim/shared";

export type SnapKind = "none" | "endpoint" | "ortho" | "close";

export type SnapResult = {
  point: Vec3;
  kind: SnapKind;
  /** True when snap closed the chain to its origin. */
  closed?: boolean;
};

export type SnapContext = {
  /** Raw cursor / pick in world XY (z = elevation). */
  raw: Vec3;
  /** First point of current segment, or null when placing P1. */
  pending: Vec3 | null;
  /** Start of the current chained run (for close). */
  chainOrigin: Vec3 | null;
  /** All existing wall endpoints. */
  endpoints: Vec3[];
  /** Hold Shift to force orthographic from pending. */
  forceOrtho?: boolean;
  tolerance?: number;
};

/** Soft ortho when within this angle of H/V (degrees). */
export const ORTHO_ANGLE_DEG = 12;

function dist2(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function nearestEndpoint(raw: Vec3, endpoints: Vec3[], tol: number): Vec3 | null {
  const tol2 = tol * tol;
  let best: Vec3 | null = null;
  let bestD = tol2;
  for (const ep of endpoints) {
    const d = dist2(raw, ep);
    if (d <= bestD) {
      bestD = d;
      best = ep;
    }
  }
  return best;
}

/** Project raw onto nearest axis-aligned direction from pending. */
export function orthoFrom(pending: Vec3, raw: Vec3): Vec3 {
  const dx = Math.abs(raw.x - pending.x);
  const dy = Math.abs(raw.y - pending.y);
  if (dx >= dy) {
    return { x: raw.x, y: pending.y, z: pending.z };
  }
  return { x: pending.x, y: raw.y, z: pending.z };
}

function nearOrthoAxes(pending: Vec3, raw: Vec3, distTol: number): boolean {
  const dx = raw.x - pending.x;
  const dy = raw.y - pending.y;
  const len = Math.hypot(dx, dy);
  if (len < SNAP_TOLERANCE) return false;
  if (Math.abs(dy) <= distTol || Math.abs(dx) <= distTol) return true;
  const ang = Math.atan2(Math.abs(dy), Math.abs(dx)); // 0 = horizontal
  const limit = (ORTHO_ANGLE_DEG * Math.PI) / 180;
  return ang <= limit || ang >= Math.PI / 2 - limit;
}

/**
 * Snap priority for MVP wall draw:
 * 1. Close to chain origin (when drawing P2+)
 * 2. Existing endpoints
 * 3. Ortho from pending (angle/near-axis soft, or forceOrtho / Shift)
 */
export function snapWallPoint(ctx: SnapContext): SnapResult {
  const baseTol = ctx.tolerance ?? SNAP_TOLERANCE;
  // Plan views are zoomed out — give endpoints/close a usable hit radius.
  const pointTol = Math.max(baseTol, 0.2);
  const { raw, pending, chainOrigin, endpoints, forceOrtho } = ctx;

  if (pending && chainOrigin) {
    if (dist2(raw, chainOrigin) <= pointTol * pointTol) {
      return {
        point: { x: chainOrigin.x, y: chainOrigin.y, z: pending.z },
        kind: "close",
        closed: true,
      };
    }
  }

  const ep = nearestEndpoint(raw, endpoints, pointTol);
  if (ep) {
    return {
      point: { x: ep.x, y: ep.y, z: pending?.z ?? ep.z },
      kind: "endpoint",
    };
  }

  if (pending && (forceOrtho || nearOrthoAxes(pending, raw, baseTol))) {
    const point = orthoFrom(pending, raw);
    if (almostEqual(point.x, pending.x) && almostEqual(point.y, pending.y)) {
      return { point: { ...raw }, kind: "none" };
    }
    return { point, kind: "ortho" };
  }

  return { point: { ...raw }, kind: "none" };
}

/** Collect unique endpoints from walls. */
export function collectEndpoints(
  walls: { p1: Vec3; p2: Vec3 }[],
  extra: Vec3[] = [],
): Vec3[] {
  const out: Vec3[] = [];
  const push = (p: Vec3) => {
    if (out.some((q) => dist2(p, q) < 1e-12)) return;
    out.push({ x: p.x, y: p.y, z: p.z });
  };
  for (const w of walls) {
    push(w.p1);
    push(w.p2);
  }
  for (const p of extra) push(p);
  return out;
}
