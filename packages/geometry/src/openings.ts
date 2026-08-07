import type { Door, Wall } from "@axonbim/model";
import { MIN_WALL_LENGTH } from "@axonbim/shared";
import type { MeshBuffer } from "./types";
import { emptyMesh, type WallMeshOptions, wallBoxMesh } from "./wallBox";

export type WallOpening = {
  /** Center distance along wall axis from p1 (m). */
  centerAlong: number;
  width: number;
  height: number;
  sill: number;
};

function appendMesh(into: {
  positions: number[];
  normals: number[];
  indices: number[];
}, part: MeshBuffer): void {
  const base = into.positions.length / 3;
  for (let i = 0; i < part.positions.length; i++) {
    into.positions.push(part.positions[i]!);
    into.normals.push(part.normals[i]!);
  }
  for (let i = 0; i < part.indices.length; i++) {
    into.indices.push(part.indices[i]! + base);
  }
}

function finishMesh(acc: {
  positions: number[];
  normals: number[];
  indices: number[];
}): MeshBuffer {
  return {
    positions: new Float32Array(acc.positions),
    normals: new Float32Array(acc.normals),
    indices: new Uint32Array(acc.indices),
  };
}

/** Local-axis slab of the wall (no miters on intermediate slabs). */
function wallSlab(
  wall: Wall,
  along0: number,
  along1: number,
  z0: number,
  z1: number,
): MeshBuffer {
  if (along1 - along0 < MIN_WALL_LENGTH || z1 - z0 <= 0) return emptyMesh();
  const dx = wall.p2.x - wall.p1.x;
  const dy = wall.p2.y - wall.p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const baseZ = Math.min(wall.p1.z, wall.p2.z);
  const slab: Wall = {
    ...wall,
    p1: {
      x: wall.p1.x + ux * along0,
      y: wall.p1.y + uy * along0,
      z: baseZ + z0,
    },
    p2: {
      x: wall.p1.x + ux * along1,
      y: wall.p1.y + uy * along1,
      z: baseZ + z0,
    },
    height: z1 - z0,
  };
  return wallBoxMesh(slab);
}

/**
 * Wall solid with rectangular through-openings (union of slabs — no CSG kernel).
 * Miters apply only when there are no openings (delegates to wallBoxMesh).
 */
export function wallMeshWithOpenings(
  wall: Wall,
  openings: WallOpening[],
  joinOpts?: WallMeshOptions,
): MeshBuffer {
  const dx = wall.p2.x - wall.p1.x;
  const dy = wall.p2.y - wall.p1.y;
  const length = Math.hypot(dx, dy);
  if (length < MIN_WALL_LENGTH) return emptyMesh();

  const cleaned = openings
    .map((o) => ({
      ...o,
      width: Math.min(o.width, length - MIN_WALL_LENGTH),
      height: Math.min(o.height, wall.height - o.sill),
    }))
    .filter((o) => o.width >= MIN_WALL_LENGTH && o.height > 0)
    .sort((a, b) => a.centerAlong - b.centerAlong);

  if (cleaned.length === 0) {
    return wallBoxMesh(wall, joinOpts);
  }

  // Single opening path (first slice); multiple openings: sequential splits
  const acc = { positions: [] as number[], normals: [] as number[], indices: [] as number[] };
  let cursor = 0;
  for (const o of cleaned) {
    const left = Math.max(0, o.centerAlong - o.width / 2);
    const right = Math.min(length, o.centerAlong + o.width / 2);
    if (left - cursor >= MIN_WALL_LENGTH) {
      appendMesh(acc, wallSlab(wall, cursor, left, 0, wall.height));
    }
    if (o.sill > 0) {
      appendMesh(acc, wallSlab(wall, left, right, 0, o.sill));
    }
    const head = o.sill + o.height;
    if (head < wall.height - 1e-6) {
      appendMesh(acc, wallSlab(wall, left, right, head, wall.height));
    }
    cursor = right;
  }
  if (length - cursor >= MIN_WALL_LENGTH) {
    appendMesh(acc, wallSlab(wall, cursor, length, 0, wall.height));
  }
  return finishMesh(acc);
}

export function openingsFromDoors(wallId: string, doors: Door[]): WallOpening[] {
  return doors
    .filter((d) => d.wallId === wallId)
    .map((d) => ({
      centerAlong: d.centerOffset,
      width: d.width,
      height: d.height,
      sill: d.sill,
    }));
}

/** Project world XY point onto wall axis → offset from p1 (clamped). */
export function projectPointOnWall(
  wall: Wall,
  point: { x: number; y: number },
): { offset: number; dist: number } {
  const dx = wall.p2.x - wall.p1.x;
  const dy = wall.p2.y - wall.p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const vx = point.x - wall.p1.x;
  const vy = point.y - wall.p1.y;
  const offset = Math.min(len, Math.max(0, vx * ux + vy * uy));
  const cx = wall.p1.x + ux * offset;
  const cy = wall.p1.y + uy * offset;
  const dist = Math.hypot(point.x - cx, point.y - cy);
  return { offset, dist };
}
