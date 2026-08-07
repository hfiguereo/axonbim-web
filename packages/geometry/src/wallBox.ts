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

export type WallMeshOptions = {
  /** Extra length past p1 along -axis (m) — fills L-corners at joins. */
  extendStart?: number;
  /** Extra length past p2 along +axis (m). */
  extendEnd?: number;
};

export type WallJoinExt = { start: number; end: number };

function pointKey(x: number, y: number): string {
  return `${Math.round(x * 1000)}:${Math.round(y * 1000)}`;
}

/**
 * When two+ wall axes meet at an endpoint, extend each joining end by half thickness
 * so the outer corner fills (square butt join). Parametric p1/p2 stay unchanged.
 */
export function computeWallJoinExtensions(walls: Wall[]): Map<string, WallJoinExt> {
  type EndRef = { wallId: string; which: "start" | "end"; thickness: number };
  const buckets = new Map<string, EndRef[]>();

  const push = (key: string, ref: EndRef) => {
    const list = buckets.get(key);
    if (list) list.push(ref);
    else buckets.set(key, [ref]);
  };

  for (const w of walls) {
    push(pointKey(w.p1.x, w.p1.y), {
      wallId: w.id,
      which: "start",
      thickness: w.thickness,
    });
    push(pointKey(w.p2.x, w.p2.y), {
      wallId: w.id,
      which: "end",
      thickness: w.thickness,
    });
  }

  const out = new Map<string, WallJoinExt>();
  for (const w of walls) out.set(w.id, { start: 0, end: 0 });

  for (const refs of buckets.values()) {
    if (refs.length < 2) continue;
    for (const ref of refs) {
      const cur = out.get(ref.wallId);
      if (!cur) continue;
      const half = ref.thickness / 2;
      if (ref.which === "start") cur.start = Math.max(cur.start, half);
      else cur.end = Math.max(cur.end, half);
    }
  }

  return out;
}

/** Axis length in XY and volume of the wall box (parametric, without join extensions). */
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

/**
 * Wall box mesh: axis p1→p2 in XY, thickness centered on axis, extruded +Z by height.
 * Optional join extensions fill L-corners when walls share an endpoint.
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
  const extS = Math.max(0, opts?.extendStart ?? 0);
  const extE = Math.max(0, opts?.extendEnd ?? 0);

  const ax = wall.p1.x - ux * extS;
  const ay = wall.p1.y - uy * extS;
  const bx = wall.p2.x + ux * extE;
  const by = wall.p2.y + uy * extE;

  const z0 = Math.min(wall.p1.z, wall.p2.z);
  const z1 = z0 + wall.height;

  const b0 = { x: ax - nx * half, y: ay - ny * half, z: z0 };
  const b1 = { x: ax + nx * half, y: ay + ny * half, z: z0 };
  const b2 = { x: bx + nx * half, y: by + ny * half, z: z0 };
  const b3 = { x: bx - nx * half, y: by - ny * half, z: z0 };
  const t0 = { ...b0, z: z1 };
  const t1 = { ...b1, z: z1 };
  const t2 = { ...b2, z: z1 };
  const t3 = { ...b3, z: z1 };

  type V = { x: number; y: number; z: number };
  const faces: { a: V; b: V; c: V; d: V; n: V }[] = [
    { a: b0, b: b1, c: b2, d: b3, n: { x: 0, y: 0, z: -1 } },
    { a: t0, b: t3, c: t2, d: t1, n: { x: 0, y: 0, z: 1 } },
    { a: b0, b: b3, c: t3, d: t0, n: { x: -nx, y: -ny, z: 0 } },
    { a: b1, b: t1, c: t2, d: b2, n: { x: nx, y: ny, z: 0 } },
    { a: b0, b: t0, c: t1, d: b1, n: { x: -ux, y: -uy, z: 0 } },
    { a: b3, b: b2, c: t2, d: t3, n: { x: ux, y: uy, z: 0 } },
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
