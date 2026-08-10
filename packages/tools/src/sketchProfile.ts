/**
 * SK-profile — abstract sketch perimeter in session (not AxonDocument SoT).
 * Builders/gestures edit this profile; a commit adapter maps it to BIM hosts.
 */

import { SNAP_TOLERANCE } from "@axonbim/shared";
import type { RectWallAxis, SketchPoint } from "./sketchRect.js";

export type SketchProfileEdge = {
  p1: SketchPoint;
  p2: SketchPoint;
};

export type SketchProfile = {
  /** Walls that seeded / will be replaced on commit. */
  sourceWallIds: string[];
  edges: SketchProfileEdge[];
  closed: boolean;
  /**
   * `result` = contorno del sólido en Workplane (seed outline).
   * `axes` = ejes/polilínea de builders (rect/arco/línea).
   * Commit: huella caja (`result`) → 1 muro; libre/axes → N muros (replace).
   */
  semantic?: "result" | "axes";
};

export type WallAxisLike = {
  id: string;
  storeyId: string;
  p1: SketchPoint;
  p2: SketchPoint;
};

function near(
  a: SketchPoint,
  b: SketchPoint,
  tol = SNAP_TOLERANCE,
): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) <= tol;
}

function nearXY(
  a: SketchPoint,
  b: SketchPoint,
  tol = SNAP_TOLERANCE,
): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= tol;
}

/** Single wall axis → open profile (one edge). */
export function profileFromWallAxis(wall: WallAxisLike): SketchProfile {
  return {
    sourceWallIds: [wall.id],
    edges: [
      {
        p1: { x: wall.p1.x, y: wall.p1.y, z: wall.p1.z },
        p2: { x: wall.p2.x, y: wall.p2.y, z: wall.p2.z },
      },
    ],
    closed: false,
    semantic: "axes",
  };
}

/** Ordered walls of a simple loop → closed profile (edges oriented along walk). */
export function profileFromWallLoop(ordered: WallAxisLike[]): SketchProfile {
  if (ordered.length === 0) {
    return { sourceWallIds: [], edges: [], closed: false };
  }
  if (ordered.length === 1) {
    return profileFromWallAxis(ordered[0]!);
  }

  const edges: SketchProfileEdge[] = [];
  let cursor = ordered[0]!.p1;
  // Prefer starting so we leave seed.p1 toward the neighbor at seed.p2
  const seed = ordered[0]!;
  const second = ordered[1]!;
  if (nearXY(seed.p2, second.p1) || nearXY(seed.p2, second.p2)) {
    cursor = seed.p1;
  } else if (nearXY(seed.p1, second.p1) || nearXY(seed.p1, second.p2)) {
    cursor = seed.p2;
  }

  for (const wall of ordered) {
    const start = nearXY(wall.p1, cursor) ? wall.p1 : wall.p2;
    const end = nearXY(wall.p1, cursor) ? wall.p2 : wall.p1;
    edges.push({
      p1: { x: start.x, y: start.y, z: start.z },
      p2: { x: end.x, y: end.y, z: end.z },
    });
    cursor = end;
  }

  return {
    sourceWallIds: ordered.map((w) => w.id),
    edges,
    closed: true,
    semantic: "axes",
  };
}

/**
 * Walk a simple cycle of walls on the same storey from `seedWallId`.
 * Returns null if open, branching, or no cycle (caller falls back to single wall).
 */
export function findWallLoop(
  walls: WallAxisLike[],
  seedWallId: string,
  tol = SNAP_TOLERANCE,
): WallAxisLike[] | null {
  const seed = walls.find((w) => w.id === seedWallId);
  if (!seed) return null;
  const candidates = walls.filter((w) => w.storeyId === seed.storeyId);
  if (candidates.length < 3) return null;

  const othersAt = (pt: SketchPoint, excludeId: string): WallAxisLike[] =>
    candidates.filter(
      (w) =>
        w.id !== excludeId &&
        (nearXY(w.p1, pt, tol) || nearXY(w.p2, pt, tol)),
    );

  const path: WallAxisLike[] = [seed];
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

/**
 * Seed profile from wall **axes** (legacy / unit helpers).
 * Session Sketch Mode must use `outlineOnWorkplane` + `profileFromClosedRing`
 * (contorno resultante — see docs/architecture/sketch-result-outline.md).
 */
export function seedProfileFromWall(
  walls: WallAxisLike[],
  seedWallId: string,
): SketchProfile | null {
  const seed = walls.find((w) => w.id === seedWallId);
  if (!seed) return null;
  const loop = findWallLoop(walls, seedWallId);
  if (loop) return profileFromWallLoop(loop);
  return profileFromWallAxis(seed);
}

/** Closed (or open) ring of world points → sketch profile edges. */
export function profileFromClosedRing(
  points: SketchPoint[],
  sourceWallIds: string[],
  closed = true,
): SketchProfile {
  if (points.length === 0) {
    return { sourceWallIds: [...sourceWallIds], edges: [], closed: false };
  }
  if (points.length === 1) {
    const p = points[0]!;
    return {
      sourceWallIds: [...sourceWallIds],
      edges: [{ p1: { ...p }, p2: { ...p } }],
      closed: false,
    };
  }
  const edges: SketchProfileEdge[] = [];
  const n = points.length;
  const edgeCount = closed ? n : n - 1;
  for (let i = 0; i < edgeCount; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % n]!;
    edges.push({
      p1: { x: a.x, y: a.y, z: a.z },
      p2: { x: b.x, y: b.y, z: b.z },
    });
  }
  return {
    sourceWallIds: [...sourceWallIds],
    edges,
    closed: closed && n >= 3,
    semantic: "result",
  };
}

export function profileFromAxes(
  axes: RectWallAxis[],
  sourceWallIds: string[],
  closed: boolean,
): SketchProfile {
  return {
    sourceWallIds: [...sourceWallIds],
    edges: axes.map((a) => ({
      p1: { x: a.p1.x, y: a.p1.y, z: a.p1.z },
      p2: { x: a.p2.x, y: a.p2.y, z: a.p2.z },
    })),
    closed,
    semantic: "axes",
  };
}

export function appendProfileEdge(
  profile: SketchProfile,
  p1: SketchPoint,
  p2: SketchPoint,
  closed = false,
): SketchProfile {
  return {
    ...profile,
    edges: [
      ...profile.edges,
      {
        p1: { x: p1.x, y: p1.y, z: p1.z },
        p2: { x: p2.x, y: p2.y, z: p2.z },
      },
    ],
    closed: profile.closed || closed,
    semantic: "axes",
  };
}

/** Vertex chain for viewer overlay (closes if flag set). */
export function profileToPoints(profile: SketchProfile): SketchPoint[] {
  if (profile.edges.length === 0) return [];
  const pts: SketchPoint[] = [
    {
      x: profile.edges[0]!.p1.x,
      y: profile.edges[0]!.p1.y,
      z: profile.edges[0]!.p1.z,
    },
  ];
  for (const e of profile.edges) {
    pts.push({ x: e.p2.x, y: e.p2.y, z: e.p2.z });
  }
  if (profile.closed && pts.length >= 2) {
    const first = pts[0]!;
    const last = pts[pts.length - 1]!;
    if (!near(first, last)) {
      pts.push({ x: first.x, y: first.y, z: first.z });
    }
  }
  return pts;
}

export function profileToAxes(profile: SketchProfile): RectWallAxis[] {
  return profile.edges.map((e) => ({
    p1: { x: e.p1.x, y: e.p1.y, z: e.p1.z },
    p2: { x: e.p2.x, y: e.p2.y, z: e.p2.z },
  }));
}

/**
 * Project every profile endpoint onto a workplane elevation (horizontal storey).
 * Prefer `mapProfilePoints` + `projectPointOntoWorkplane` when the active
 * Workplane may be a surface or line (WP-v2).
 */
export function projectProfileToWorkplaneZ(
  profile: SketchProfile,
  z: number,
): SketchProfile {
  return mapProfilePoints(profile, (p) => ({ x: p.x, y: p.y, z }));
}

/** Map every edge endpoint (seed / rebuild onto the active Workplane). */
export function mapProfilePoints(
  profile: SketchProfile,
  mapPoint: (p: SketchPoint) => SketchPoint,
): SketchProfile {
  return {
    sourceWallIds: [...profile.sourceWallIds],
    closed: profile.closed,
    semantic: profile.semantic,
    edges: profile.edges.map((e) => ({
      p1: mapPoint(e.p1),
      p2: mapPoint(e.p2),
    })),
  };
}

/** Unique vertices in walk order (for grips). Closed loops omit duplicate close. */
export function profileVertices(profile: SketchProfile): SketchPoint[] {
  const pts = profileToPoints(profile);
  if (profile.closed && pts.length >= 2) {
    const a = pts[0]!;
    const b = pts[pts.length - 1]!;
    if (near(a, b)) return pts.slice(0, -1);
  }
  return pts;
}

/** Hit-test a workplane pick against profile vertices. */
export function hitProfileVertex(
  profile: SketchProfile,
  world: SketchPoint,
  tol = SNAP_TOLERANCE * 3,
): number {
  const verts = profileVertices(profile);
  let best = -1;
  let bestD = tol;
  for (let i = 0; i < verts.length; i++) {
    const v = verts[i]!;
    const d = Math.hypot(world.x - v.x, world.y - v.y, world.z - v.z);
    if (d <= bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/**
 * Move a vertex (by index in `profileVertices`) on the workplane.
 * Shared corners update all incident edges.
 */
export function moveProfileVertex(
  profile: SketchProfile,
  vertexIndex: number,
  to: SketchPoint,
  tol = SNAP_TOLERANCE,
): SketchProfile | null {
  const verts = profileVertices(profile);
  if (vertexIndex < 0 || vertexIndex >= verts.length) return null;
  const from = verts[vertexIndex]!;
  const next = {
    x: to.x,
    y: to.y,
    z: to.z,
  };
  return {
    sourceWallIds: [...profile.sourceWallIds],
    closed: profile.closed,
    semantic: profile.semantic,
    edges: profile.edges.map((e) => ({
      p1: near(e.p1, from, tol) ? { ...next } : { ...e.p1 },
      p2: near(e.p2, from, tol) ? { ...next } : { ...e.p2 },
    })),
  };
}
