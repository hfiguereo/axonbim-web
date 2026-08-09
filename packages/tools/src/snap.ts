import { SNAP_TOLERANCE, almostEqual, type Vec3 } from "@axonbim/shared";

export type SnapKind = "none" | "endpoint" | "ortho" | "close";

/** Temporary ortho axis lock for the active draw segment (LR1). Not in AxonDocument. */
export type AxisLock = "none" | "horizontal" | "vertical";

export type SnapSession = {
  axisLock: AxisLock;
};

export type SnapResult = {
  point: Vec3;
  kind: SnapKind;
  /** True when snap closed the chain to its origin. */
  closed?: boolean;
  /** Updated interaction session after this resolution. */
  session: SnapSession;
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
  /** Prior SnapSession; omitted = unlocked. */
  session?: SnapSession;
};

/** Soft ortho enter band (degrees from H/V). */
export const ORTHO_ENTER_ANGLE_DEG = 12;
/** Keep lock until cursor leaves this wider band (hysteresis). */
export const ORTHO_HOLD_ANGLE_DEG = 22;
/** @deprecated Use ORTHO_ENTER_ANGLE_DEG — kept for ADR 0009 / callers. */
export const ORTHO_ANGLE_DEG = ORTHO_ENTER_ANGLE_DEG;

export function emptySnapSession(): SnapSession {
  return { axisLock: "none" };
}

export function clearSnapSession(): SnapSession {
  return emptySnapSession();
}

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

export function applyAxisLock(pending: Vec3, raw: Vec3, lock: "horizontal" | "vertical"): Vec3 {
  if (lock === "horizontal") {
    return { x: raw.x, y: pending.y, z: pending.z };
  }
  return { x: pending.x, y: raw.y, z: pending.z };
}

/** Angle from horizontal in [0, π/2]; null if segment too short. */
export function axisAngleFromHorizontal(pending: Vec3, raw: Vec3): number | null {
  const dx = raw.x - pending.x;
  const dy = raw.y - pending.y;
  const len = Math.hypot(dx, dy);
  if (len < SNAP_TOLERANCE) return null;
  return Math.atan2(Math.abs(dy), Math.abs(dx));
}

function nearerAxis(ang: number): "horizontal" | "vertical" {
  return ang <= Math.PI / 4 ? "horizontal" : "vertical";
}

function withinAxisBand(
  ang: number,
  axis: "horizontal" | "vertical",
  limitRad: number,
): boolean {
  if (axis === "horizontal") return ang <= limitRad;
  return ang >= Math.PI / 2 - limitRad;
}

function orthoResult(
  pending: Vec3,
  raw: Vec3,
  lock: "horizontal" | "vertical",
  session: SnapSession,
): SnapResult {
  const point = applyAxisLock(pending, raw, lock);
  if (almostEqual(point.x, pending.x) && almostEqual(point.y, pending.y)) {
    return { point: { ...raw }, kind: "none", session };
  }
  return { point, kind: "ortho", session: { axisLock: lock } };
}

/**
 * Snap priority for wall draw (ADR 0009 + LR1):
 * 1. Close to chain origin (when drawing P2+)
 * 2. Existing endpoints
 * 3. Ortho from pending with axis-lock hysteresis (or forceOrtho / Shift)
 *
 * SnapSession is interaction-only — never part of AxonDocument / history.
 */
export function snapWallPoint(ctx: SnapContext): SnapResult {
  const baseTol = ctx.tolerance ?? SNAP_TOLERANCE;
  // Plan views are zoomed out — give endpoints/close a usable hit radius.
  const pointTol = Math.max(baseTol, 0.2);
  const { raw, pending, chainOrigin, endpoints, forceOrtho } = ctx;
  let session = ctx.session ? { ...ctx.session } : emptySnapSession();

  // P1: endpoints only — no ortho lock without a segment origin.
  if (!pending) {
    const ep0 = nearestEndpoint(raw, endpoints, pointTol);
    if (ep0) {
      return {
        point: { x: ep0.x, y: ep0.y, z: ep0.z },
        kind: "endpoint",
        session: emptySnapSession(),
      };
    }
    return { point: { ...raw }, kind: "none", session: emptySnapSession() };
  }

  if (chainOrigin) {
    if (dist2(raw, chainOrigin) <= pointTol * pointTol) {
      return {
        point: { x: chainOrigin.x, y: chainOrigin.y, z: pending.z },
        kind: "close",
        closed: true,
        session,
      };
    }
  }

  const ep = nearestEndpoint(raw, endpoints, pointTol);
  if (ep) {
    return {
      point: { x: ep.x, y: ep.y, z: pending.z },
      kind: "endpoint",
      session,
    };
  }

  const enterRad = (ORTHO_ENTER_ANGLE_DEG * Math.PI) / 180;
  const holdRad = (ORTHO_HOLD_ANGLE_DEG * Math.PI) / 180;
  const ang = axisAngleFromHorizontal(pending, raw);
  const nearH = Math.abs(raw.y - pending.y) <= baseTol;
  const nearV = Math.abs(raw.x - pending.x) <= baseTol;

  if (forceOrtho) {
    if (ang === null) {
      return { point: { ...raw }, kind: "none", session };
    }
    const lock = nearerAxis(ang);
    return orthoResult(pending, raw, lock, session);
  }

  if (session.axisLock === "horizontal" || session.axisLock === "vertical") {
    const lock = session.axisLock;
    const hold =
      ang === null ||
      withinAxisBand(ang, lock, holdRad) ||
      (lock === "horizontal" && nearH) ||
      (lock === "vertical" && nearV);
    if (hold) {
      return orthoResult(pending, raw, lock, session);
    }
    session = emptySnapSession();
  }

  if (ang !== null) {
    if (withinAxisBand(ang, "horizontal", enterRad) || nearH) {
      return orthoResult(pending, raw, "horizontal", session);
    }
    if (withinAxisBand(ang, "vertical", enterRad) || nearV) {
      return orthoResult(pending, raw, "vertical", session);
    }
  } else if (nearH) {
    return orthoResult(pending, raw, "horizontal", session);
  } else if (nearV) {
    return orthoResult(pending, raw, "vertical", session);
  }

  return { point: { ...raw }, kind: "none", session: emptySnapSession() };
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
