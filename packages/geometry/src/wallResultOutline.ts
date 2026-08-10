/**
 * Contorno resultante del muro caja sobre un Workplane.
 * Contrato: docs/architecture/sketch-result-outline.md
 */

import {
  projectPointOntoWorkplane,
  workplaneFromWallFace,
  workplanePointFromUV,
  worldToWorkplaneUV,
  type Wall,
  type Workplane,
} from "@axonbim/model";
import { MIN_WALL_LENGTH, SNAP_TOLERANCE, type Vec3 } from "@axonbim/shared";
import {
  computeWallJoinDirs,
  miterCorners,
  type WallMeshOptions,
} from "./wallBox.js";

export type ResultOutline = {
  /** Closed ring vertices in world (first ≠ last; closed flag says to close). */
  points: Vec3[];
  closed: boolean;
  sourceWallIds: string[];
};

type V2 = { x: number; y: number }; // plan XY

function nearXY(a: Vec3, b: Vec3, tol = SNAP_TOLERANCE): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= tol;
}

/** Four plan corners of the wall box (z = base), optional miters. Order: b0,b1,b2,b3 as wallBoxMesh. */
export function wallBoxPlanCorners(
  wall: Wall,
  opts?: WallMeshOptions,
): [Vec3, Vec3, Vec3, Vec3] | null {
  const dx = wall.p2.x - wall.p1.x;
  const dy = wall.p2.y - wall.p1.y;
  const length = Math.hypot(dx, dy);
  if (length < MIN_WALL_LENGTH || wall.thickness <= 0) return null;

  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const half = wall.thickness / 2;
  const z0 = Math.min(wall.p1.z, wall.p2.z);
  const p1 = { x: wall.p1.x, y: wall.p1.y };
  const p2 = { x: wall.p2.x, y: wall.p2.y };

  let b0: V2;
  let b1: V2;
  let b2: V2;
  let b3: V2;

  if (opts?.joinStartAway) {
    const m = miterCorners(p1, { x: -ux, y: -uy }, opts.joinStartAway, half);
    b0 = { x: m.left.x, y: m.left.y };
    b1 = { x: m.right.x, y: m.right.y };
  } else {
    b0 = { x: p1.x - nx * half, y: p1.y - ny * half };
    b1 = { x: p1.x + nx * half, y: p1.y + ny * half };
  }

  if (opts?.joinEndAway) {
    const m = miterCorners(p2, { x: ux, y: uy }, opts.joinEndAway, half);
    b2 = { x: m.left.x, y: m.left.y };
    b3 = { x: m.right.x, y: m.right.y };
  } else {
    b2 = { x: p2.x + nx * half, y: p2.y + ny * half };
    b3 = { x: p2.x - nx * half, y: p2.y - ny * half };
  }

  return [
    { x: b0.x, y: b0.y, z: z0 },
    { x: b1.x, y: b1.y, z: z0 },
    { x: b2.x, y: b2.y, z: z0 },
    { x: b3.x, y: b3.y, z: z0 },
  ];
}

/** Eight corners of the wall box prism (bottom then top, same plan order). */
export function wallBoxCorners3(
  wall: Wall,
  opts?: WallMeshOptions,
): Vec3[] | null {
  const base = wallBoxPlanCorners(wall, opts);
  if (!base) return null;
  const z0 = base[0]!.z;
  const z1 = z0 + wall.height;
  return [
    ...base,
    { x: base[0]!.x, y: base[0]!.y, z: z1 },
    { x: base[1]!.x, y: base[1]!.y, z: z1 },
    { x: base[2]!.x, y: base[2]!.y, z: z1 },
    { x: base[3]!.x, y: base[3]!.y, z: z1 },
  ];
}

/** Walk a simple cycle on the same storey (same rules as tools findWallLoop). */
export function findWallLoop(
  walls: Wall[],
  seedWallId: string,
  tol = SNAP_TOLERANCE,
): Wall[] | null {
  const seed = walls.find((w) => w.id === seedWallId);
  if (!seed) return null;
  const candidates = walls.filter((w) => w.storeyId === seed.storeyId);
  if (candidates.length < 3) return null;

  const othersAt = (pt: Vec3, excludeId: string): Wall[] =>
    candidates.filter(
      (w) =>
        w.id !== excludeId &&
        (nearXY(w.p1, pt, tol) || nearXY(w.p2, pt, tol)),
    );

  const path: Wall[] = [seed];
  const used = new Set<string>([seed.id]);
  let arriveAt = seed.p2;
  let current = seed;

  for (let guard = 0; guard < candidates.length + 2; guard++) {
    const nexts = othersAt(arriveAt, current.id);
    const unused = nexts.filter((w) => !used.has(w.id));

    if (unused.length === 0) {
      const closesToSeed = nexts.some((w) => w.id === seed.id);
      if (closesToSeed && path.length >= 3 && nearXY(arriveAt, seed.p1, tol)) {
        return path;
      }
      return null;
    }
    if (unused.length > 1) return null;

    const next = unused[0]!;
    path.push(next);
    used.add(next.id);
    arriveAt = nearXY(next.p1, arriveAt, tol) ? next.p2 : next.p1;
    current = next;

    if (nearXY(arriveAt, seed.p1, tol) && path.length >= 3) {
      return path;
    }
  }
  return null;
}

type Oriented = { wall: Wall; start: Vec3; end: Vec3 };

function orientLoop(loop: Wall[]): Oriented[] {
  if (loop.length === 0) return [];
  const out: Oriented[] = [];
  let cursor = loop[0]!.p1;
  const seed = loop[0]!;
  const second = loop[1];
  if (second) {
    if (nearXY(seed.p2, second.p1) || nearXY(seed.p2, second.p2)) {
      cursor = seed.p1;
    } else if (nearXY(seed.p1, second.p1) || nearXY(seed.p1, second.p2)) {
      cursor = seed.p2;
    }
  }
  for (const wall of loop) {
    const start = nearXY(wall.p1, cursor) ? wall.p1 : wall.p2;
    const end = nearXY(wall.p1, cursor) ? wall.p2 : wall.p1;
    out.push({ wall, start, end });
    cursor = end;
  }
  return out;
}

function signedAreaXY(poly: Vec3[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    a += p.x * q.y - q.x * p.y;
  }
  return a * 0.5;
}

/** Single-wall plan footprint: closed rectangle b0→b3→b2→b1 (CCW when û=+x). */
function storeyFootprintSingle(wall: Wall): ResultOutline | null {
  const c = wallBoxPlanCorners(wall);
  if (!c) return null;
  // b0 (right start), b3 (right end), b2 (left end), b1 (left start)
  return {
    points: [c[0]!, c[3]!, c[2]!, c[1]!],
    closed: true,
    sourceWallIds: [wall.id],
  };
}

/** Outer ring of a closed wall loop on the storey plane (mitered). */
function storeyOuterRing(loop: Wall[]): ResultOutline | null {
  const oriented = orientLoop(loop);
  if (oriented.length < 3) return null;
  const axisPoly = oriented.map((o) => o.start);
  const area = signedAreaXY(axisPoly);
  // CCW (area>0): interior left → outer = right of walk (= -nLeft relative to û)
  const outerIsRight = area >= 0;
  const joins = computeWallJoinDirs(loop);
  const z = Math.min(...loop.map((w) => Math.min(w.p1.z, w.p2.z)));
  const points: Vec3[] = [];

  for (const seg of oriented) {
    const wall = seg.wall;
    const j = joins.get(wall.id);
    const corners = wallBoxPlanCorners(wall, {
      joinStartAway: j?.startAway ?? null,
      joinEndAway: j?.endAway ?? null,
    });
    if (!corners) return null;
    const alongP1P2 = nearXY(seg.start, wall.p1);
    // corners: b0 right-start, b1 left-start, b2 left-end, b3 right-end (along p1→p2)
    let outerStart: Vec3;
    let outerEnd: Vec3;
    if (alongP1P2) {
      if (outerIsRight) {
        outerStart = corners[0]!;
        outerEnd = corners[3]!;
      } else {
        outerStart = corners[1]!;
        outerEnd = corners[2]!;
      }
    } else {
      // walking p2→p1: right of walk = left of p1→p2
      if (outerIsRight) {
        outerStart = corners[2]!;
        outerEnd = corners[1]!;
      } else {
        outerStart = corners[3]!;
        outerEnd = corners[0]!;
      }
    }
    if (points.length === 0) {
      points.push({ x: outerStart.x, y: outerStart.y, z });
    }
    points.push({ x: outerEnd.x, y: outerEnd.y, z });
  }

  // Drop duplicate closing vertex if walk returned to start
  if (points.length > 1 && nearXY(points[0]!, points[points.length - 1]!)) {
    points.pop();
  }
  return {
    points,
    closed: true,
    sourceWallIds: loop.map((w) => w.id),
  };
}

function surfaceFaceOutline(wall: Wall, wp: Workplane): ResultOutline | null {
  const dx = wall.p2.x - wall.p1.x;
  const dy = wall.p2.y - wall.p1.y;
  const length = Math.hypot(dx, dy);
  if (length < MIN_WALL_LENGTH || wall.height <= 0) return null;

  // Prefer host face plane; if WP has no host, rebuild from wall + face toward origin.
  let faceWp = wp;
  if (wp.kind === "surface" && wp.host?.kind === "wall" && wp.host.id === wall.id) {
    const rebuilt = workplaneFromWallFace(wall, wp.host.face ?? "front");
    if (rebuilt) faceWp = rebuilt;
  } else if (wp.kind === "surface") {
    // Keep given WP frame
  }

  const halfL = length / 2;
  const h = wall.height;
  const pts = [
    workplanePointFromUV(faceWp, -halfL, 0),
    workplanePointFromUV(faceWp, halfL, 0),
    workplanePointFromUV(faceWp, halfL, h),
    workplanePointFromUV(faceWp, -halfL, h),
  ];
  return { points: pts, closed: true, sourceWallIds: [wall.id] };
}

/** Monotone-chain convex hull in UV; returns world points on the workplane. */
function convexHullOnWorkplane(wp: Workplane, worldPts: Vec3[]): Vec3[] {
  type UV = { u: number; v: number; p: Vec3 };
  const uv: UV[] = worldPts.map((p) => {
    const q = projectPointOntoWorkplane(wp, p);
    const { u, v } = worldToWorkplaneUV(wp, q);
    return { u, v, p: q };
  });
  uv.sort((a, b) => (a.u === b.u ? a.v - b.v : a.u - b.u));
  const cross = (o: UV, a: UV, b: UV) =>
    (a.u - o.u) * (b.v - o.v) - (a.v - o.v) * (b.u - o.u);
  const lower: UV[] = [];
  for (const p of uv) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: UV[] = [];
  for (let i = uv.length - 1; i >= 0; i--) {
    const p = uv[i]!;
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper].map((x) => x.p);
}

function lineSilhouette(wall: Wall, wp: Workplane): ResultOutline | null {
  const corners = wallBoxCorners3(wall);
  if (!corners) return null;
  const hull = convexHullOnWorkplane(wp, corners);
  if (hull.length < 3) return null;
  return { points: hull, closed: true, sourceWallIds: [wall.id] };
}

/**
 * Contorno del sólido resultante sobre el Workplane activo.
 * Muro suelto o bucle cerrado según findWallLoop.
 */
export function outlineOnWorkplane(
  walls: Wall[],
  seedWallId: string,
  wp: Workplane,
): ResultOutline | null {
  const seed = walls.find((w) => w.id === seedWallId);
  if (!seed) return null;

  if (wp.kind === "storey") {
    const loop = findWallLoop(walls, seedWallId);
    if (loop) return storeyOuterRing(loop);
    return storeyFootprintSingle(seed);
  }

  if (wp.kind === "surface") {
    return surfaceFaceOutline(seed, wp);
  }

  // line (and any future vertical custom): silhouette of seed prism
  return lineSilhouette(seed, wp);
}

/**
 * True when a 4-pt ring looks like a wall box footprint (opposite edges
 * nearly parallel and length-matched). Free sketches that fail this should
 * commit as axes-from-edges, not a single inverted wall.
 */
export function isWallBoxFootprint(points: Vec3[]): boolean {
  if (points.length !== 4) return false;
  const edges = [0, 1, 2, 3].map((i) => {
    const a = points[i]!;
    const b = points[(i + 1) % 4]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    return { dx, dy, len };
  });
  if (edges.some((e) => e.len < MIN_WALL_LENGTH)) return false;
  const unit = (e: { dx: number; dy: number; len: number }) => ({
    x: e.dx / e.len,
    y: e.dy / e.len,
  });
  const u0 = unit(edges[0]!);
  const u1 = unit(edges[1]!);
  const u2 = unit(edges[2]!);
  const u3 = unit(edges[3]!);
  const parallel = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.abs(a.x * b.x + a.y * b.y) >= 0.98;
  if (!parallel(u0, u2) || !parallel(u1, u3)) return false;
  const lenMatch = (a: number, b: number) =>
    Math.abs(a - b) <= Math.max(a, b) * 0.08 + 1e-6;
  return lenMatch(edges[0]!.len, edges[2]!.len) && lenMatch(edges[1]!.len, edges[3]!.len);
}

/** Invert a 4-edge storey footprint → axis + thickness. */
export function invertStoreyFootprint(points: Vec3[]): {
  p1: Vec3;
  p2: Vec3;
  thickness: number;
} | null {
  if (points.length !== 4) return null;
  const edges = [0, 1, 2, 3].map((i) => {
    const a = points[i]!;
    const b = points[(i + 1) % 4]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    return { i, a, b, len };
  });
  // Opposite edges are (0,2) and (1,3). Long pair = larger combined length.
  const pair02 = edges[0]!.len + edges[2]!.len;
  const pair13 = edges[1]!.len + edges[3]!.len;
  const longA = pair02 >= pair13 ? edges[0]! : edges[1]!;
  const longB = pair02 >= pair13 ? edges[2]! : edges[3]!;
  const shortA = pair02 >= pair13 ? edges[1]! : edges[0]!;
  const shortB = pair02 >= pair13 ? edges[3]! : edges[2]!;

  const mid = (a: Vec3, b: Vec3): Vec3 => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
  });
  // Axis = midpoints of the two short ends (robust for skewed footprints).
  let p1 = mid(shortA.a, shortA.b);
  let p2 = mid(shortB.a, shortB.b);
  // Orient along longA (opposite long edges cancel if averaged).
  const longDir = { x: longA.b.x - longA.a.x, y: longA.b.y - longA.a.y };
  const axisDir = { x: p2.x - p1.x, y: p2.y - p1.y };
  if (axisDir.x * longDir.x + axisDir.y * longDir.y < 0) {
    const t = p1;
    p1 = p2;
    p2 = t;
  }
  if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < MIN_WALL_LENGTH) {
    return null;
  }
  const m1 = mid(longA.a, longA.b);
  const m2 = mid(longB.a, longB.b);
  const thickness = Math.hypot(m2.x - m1.x, m2.y - m1.y);
  if (thickness < 1e-6) return null;
  const z = points[0]!.z;
  return {
    p1: { x: p1.x, y: p1.y, z },
    p2: { x: p2.x, y: p2.y, z },
    thickness,
  };
}

/**
 * Inset a closed outer ring toward its interior by half thickness → wall axes.
 * One axis per ring edge.
 */
export function insetRingToAxes(
  ring: Vec3[],
  thickness: number,
): { p1: Vec3; p2: Vec3 }[] | null {
  if (ring.length < 3 || thickness <= 0) return null;
  const half = thickness / 2;
  const area = signedAreaXY(ring);
  // CCW ring: interior left → inset = +nLeft * half along each edge
  const inwardSign = area >= 0 ? 1 : -1;
  const z = ring[0]!.z;
  const axes: { p1: Vec3; p2: Vec3 }[] = [];

  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < MIN_WALL_LENGTH) continue;
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy * inwardSign;
    const ny = ux * inwardSign;
    axes.push({
      p1: { x: a.x + nx * half, y: a.y + ny * half, z },
      p2: { x: b.x + nx * half, y: b.y + ny * half, z },
    });
  }
  return axes.length >= 3 ? axes : null;
}

/** Midline of opposite edges for a vertical face rectangle (UV). */
export function invertVerticalFaceOutline(
  points: Vec3[],
  wp: Workplane,
): { p1: Vec3; p2: Vec3; height: number } | null {
  if (points.length < 3) return null;
  const uvs = points.map((p) => worldToWorkplaneUV(wp, p));
  const uMin = Math.min(...uvs.map((x) => x.u));
  const uMax = Math.max(...uvs.map((x) => x.u));
  const vMin = Math.min(...uvs.map((x) => x.v));
  const vMax = Math.max(...uvs.map((x) => x.v));
  const height = vMax - vMin;
  if (uMax - uMin < MIN_WALL_LENGTH || height <= 0) return null;
  // Bottom edge midpoints → project to storey as axis via face origin height
  const a = workplanePointFromUV(wp, uMin, vMin);
  const b = workplanePointFromUV(wp, uMax, vMin);
  // Axis is on the wall centerline: step back half thickness along -normal from face.
  // Caller supplies thickness; here return face-bottom endpoints and height.
  // Session will map face line to axis using wall thickness / host.
  return {
    p1: { x: a.x, y: a.y, z: a.z },
    p2: { x: b.x, y: b.y, z: b.z },
    height,
  };
}

/** Move face-bottom endpoints to wall axis (half thickness along -normal). */
export function faceLineToWallAxis(
  p1: Vec3,
  p2: Vec3,
  wp: Workplane,
  thickness: number,
): { p1: Vec3; p2: Vec3 } {
  const half = thickness / 2;
  const n = wp.normal;
  return {
    p1: {
      x: p1.x - n.x * half,
      y: p1.y - n.y * half,
      z: Math.min(p1.z, p2.z),
    },
    p2: {
      x: p2.x - n.x * half,
      y: p2.y - n.y * half,
      z: Math.min(p1.z, p2.z),
    },
  };
}
