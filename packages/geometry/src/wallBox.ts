import type { Wall } from "@axonbim/model";
import { MIN_WALL_LENGTH, type Vec3 } from "@axonbim/shared";
import type { MeshBuffer } from "./types";

export type { MeshBuffer } from "./types";

export function emptyMesh(): MeshBuffer {
  return {
    positions: new Float32Array(0),
    normals: new Float32Array(0),
    indices: new Uint32Array(0),
  };
}

export type WallMetrics = {
  length: number;
  volume: number;
  centroidXY: { x: number; y: number };
  bbox: { min: Vec3; max: Vec3 };
};

export type Vec2 = { x: number; y: number };

/** Other-wall direction (unit) leaving this wall's endpoint — enables clean miter. */
export type WallMeshOptions = {
  joinStartAway?: Vec2 | null;
  joinEndAway?: Vec2 | null;
};

export type WallJoinDirs = {
  startAway: Vec2 | null;
  endAway: Vec2 | null;
};

type V = { x: number; y: number; z: number };

function pointKey(x: number, y: number): string {
  return `${Math.round(x * 1000)}:${Math.round(y * 1000)}`;
}

function hypot2(x: number, y: number): number {
  return Math.hypot(x, y);
}

function norm2(x: number, y: number): Vec2 {
  const L = hypot2(x, y) || 1;
  return { x: x / L, y: y / L };
}

/**
 * Miter corners at a join (polyline stroke).
 * `towardJoin` = unit along this wall pointing at the shared vertex.
 * `otherAway` = unit along the other wall leaving the vertex.
 * `left`/`right` are relative to `towardJoin`.
 */
export function miterCorners(
  join: Vec2,
  towardJoin: Vec2,
  otherAway: Vec2,
  half: number,
): { left: Vec2; right: Vec2 } {
  const v1 = norm2(towardJoin.x, towardJoin.y);
  const v2 = norm2(otherAway.x, otherAway.y);
  const n1 = { x: -v1.y, y: v1.x };
  const n2 = { x: -v2.y, y: v2.x };
  let mx = n1.x + n2.x;
  let my = n1.y + n2.y;
  const mLen = hypot2(mx, my);
  if (mLen < 1e-8) {
    return {
      left: { x: join.x + n1.x * half, y: join.y + n1.y * half },
      right: { x: join.x - n1.x * half, y: join.y - n1.y * half },
    };
  }
  mx /= mLen;
  my /= mLen;
  let denom = mx * n1.x + my * n1.y;
  if (Math.abs(denom) < 1e-6) denom = Math.sign(denom || 1) * 1e-6;
  let ext = half / denom;
  // Limit spikes on sharp angles (~22.5° half-angle)
  const maxExt = half / Math.sin(Math.PI / 8);
  if (Math.abs(ext) > maxExt) ext = Math.sign(ext) * maxExt;
  return {
    left: { x: join.x + mx * ext, y: join.y + my * ext },
    right: { x: join.x - mx * ext, y: join.y - my * ext },
  };
}

/**
 * For valence-2 endpoint meetings, return the other wall's away direction.
 * Valence ≠ 2 → no miter (square end) to avoid ambiguous T-junctions.
 */
export function computeWallJoinDirs(walls: Wall[]): Map<string, WallJoinDirs> {
  type EndRef = {
    wallId: string;
    which: "start" | "end";
    away: Vec2;
  };
  const buckets = new Map<string, EndRef[]>();

  const push = (key: string, ref: EndRef) => {
    const list = buckets.get(key);
    if (list) list.push(ref);
    else buckets.set(key, [ref]);
  };

  for (const w of walls) {
    const dx = w.p2.x - w.p1.x;
    const dy = w.p2.y - w.p1.y;
    const along = norm2(dx, dy);
    push(pointKey(w.p1.x, w.p1.y), {
      wallId: w.id,
      which: "start",
      away: along, // from p1 toward p2
    });
    push(pointKey(w.p2.x, w.p2.y), {
      wallId: w.id,
      which: "end",
      away: { x: -along.x, y: -along.y }, // from p2 toward p1
    });
  }

  const out = new Map<string, WallJoinDirs>();
  for (const w of walls) out.set(w.id, { startAway: null, endAway: null });

  for (const refs of buckets.values()) {
    if (refs.length !== 2) continue;
    const [a, b] = refs as [EndRef, EndRef];
    const apply = (self: EndRef, other: EndRef) => {
      const cur = out.get(self.wallId);
      if (!cur) return;
      // other.away points from join into the other wall's body — that is "otherAway"
      if (self.which === "start") cur.startAway = other.away;
      else cur.endAway = other.away;
    };
    apply(a, b);
    apply(b, a);
  }

  return out;
}

/** @deprecated Use computeWallJoinDirs + miter; kept name avoided — removed. */

/** Axis length / volume oracles (parametric rectangle, no miter). */
export function wallMetrics(wall: Wall): WallMetrics {
  const dx = wall.p2.x - wall.p1.x;
  const dy = wall.p2.y - wall.p1.y;
  const length = Math.hypot(dx, dy);
  const z0 = Math.min(wall.p1.z, wall.p2.z);
  const z1 = z0 + wall.height;
  const ux = length > 0 ? dx / length : 1;
  const uy = length > 0 ? dy / length : 0;
  const nx = -uy;
  const ny = ux;
  const half = wall.thickness / 2;
  const corners = [
    { x: wall.p1.x - nx * half, y: wall.p1.y - ny * half },
    { x: wall.p1.x + nx * half, y: wall.p1.y + ny * half },
    { x: wall.p2.x + nx * half, y: wall.p2.y + ny * half },
    { x: wall.p2.x - nx * half, y: wall.p2.y - ny * half },
  ];
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  return {
    length,
    volume: length * wall.thickness * wall.height,
    centroidXY: {
      x: (wall.p1.x + wall.p2.x) / 2,
      y: (wall.p1.y + wall.p2.y) / 2,
    },
    bbox: {
      min: { x: Math.min(...xs), y: Math.min(...ys), z: z0 },
      max: { x: Math.max(...xs), y: Math.max(...ys), z: z1 },
    },
  };
}

function faceNormal(a: V, b: V, c: V): V {
  const e1x = b.x - a.x;
  const e1y = b.y - a.y;
  const e1z = b.z - a.z;
  const e2x = c.x - a.x;
  const e2y = c.y - a.y;
  const e2z = c.z - a.z;
  let nx = e1y * e2z - e1z * e2y;
  let ny = e1z * e2x - e1x * e2z;
  let nz = e1x * e2y - e1y * e2x;
  const L = Math.hypot(nx, ny, nz) || 1;
  nx /= L;
  ny /= L;
  nz /= L;
  return { x: nx, y: ny, z: nz };
}

/**
 * Wall box mesh with optional clean miters at joined ends (no boolean / no overlap slab).
 */
export function wallBoxMesh(wall: Wall, opts?: WallMeshOptions): MeshBuffer {
  const dx = wall.p2.x - wall.p1.x;
  const dy = wall.p2.y - wall.p1.y;
  const length = Math.hypot(dx, dy);
  if (length < MIN_WALL_LENGTH || wall.height <= 0 || wall.thickness <= 0) {
    return emptyMesh();
  }

  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const half = wall.thickness / 2;
  const z0 = Math.min(wall.p1.z, wall.p2.z);
  const z1 = z0 + wall.height;

  const p1 = { x: wall.p1.x, y: wall.p1.y };
  const p2 = { x: wall.p2.x, y: wall.p2.y };

  let b0: V;
  let b1: V;
  let b2: V;
  let b3: V;

  if (opts?.joinStartAway) {
    // toward join along wall = -û
    const m = miterCorners(p1, { x: -ux, y: -uy }, opts.joinStartAway, half);
    b0 = { x: m.left.x, y: m.left.y, z: z0 }; // right of û
    b1 = { x: m.right.x, y: m.right.y, z: z0 }; // left of û
  } else {
    b0 = { x: p1.x - nx * half, y: p1.y - ny * half, z: z0 };
    b1 = { x: p1.x + nx * half, y: p1.y + ny * half, z: z0 };
  }

  if (opts?.joinEndAway) {
    const m = miterCorners(p2, { x: ux, y: uy }, opts.joinEndAway, half);
    b2 = { x: m.left.x, y: m.left.y, z: z0 };
    b3 = { x: m.right.x, y: m.right.y, z: z0 };
  } else {
    b2 = { x: p2.x + nx * half, y: p2.y + ny * half, z: z0 };
    b3 = { x: p2.x - nx * half, y: p2.y - ny * half, z: z0 };
  }

  const t0 = { ...b0, z: z1 };
  const t1 = { ...b1, z: z1 };
  const t2 = { ...b2, z: z1 };
  const t3 = { ...b3, z: z1 };

  const faces: { a: V; b: V; c: V; d: V; n: V }[] = [
    { a: b0, b: b1, c: b2, d: b3, n: { x: 0, y: 0, z: -1 } },
    { a: t0, b: t3, c: t2, d: t1, n: { x: 0, y: 0, z: 1 } },
    { a: b0, b: b3, c: t3, d: t0, n: faceNormal(b0, b3, t3) },
    { a: b1, b: t1, c: t2, d: b2, n: faceNormal(b1, t1, t2) },
    { a: b0, b: t0, c: t1, d: b1, n: faceNormal(b0, t0, t1) },
    { a: b3, b: b2, c: t2, d: t3, n: faceNormal(b3, b2, t2) },
  ];

  const positions = new Float32Array(faces.length * 4 * 3);
  const normals = new Float32Array(faces.length * 4 * 3);
  const indices = new Uint32Array(faces.length * 6);

  faces.forEach((face, fi) => {
    const verts = [face.a, face.b, face.c, face.d];
    const base = fi * 4;
    verts.forEach((v, vi) => {
      const o = (base + vi) * 3;
      positions[o] = v.x;
      positions[o + 1] = v.y;
      positions[o + 2] = v.z;
      normals[o] = face.n.x;
      normals[o + 1] = face.n.y;
      normals[o + 2] = face.n.z;
    });
    const io = fi * 6;
    indices[io] = base;
    indices[io + 1] = base + 1;
    indices[io + 2] = base + 2;
    indices[io + 3] = base;
    indices[io + 4] = base + 2;
    indices[io + 5] = base + 3;
  });

  return { positions, normals, indices };
}
