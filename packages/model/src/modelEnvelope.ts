import type { AxonDocument } from "./types.js";

/**
 * LR3-C — axis-aligned envelope derived from the document (not persisted SoT).
 */
export type ModelEnvelope = {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  center: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  /** True when no walls contributed geometry. */
  empty: boolean;
};

const EMPTY: ModelEnvelope = {
  minX: 0,
  minY: 0,
  minZ: 0,
  maxX: 0,
  maxY: 0,
  maxZ: 0,
  center: { x: 0, y: 0, z: 0 },
  size: { x: 0, y: 0, z: 0 },
  empty: true,
};

/** Rebuild completely from walls (and their height). No document mutation. */
export function computeModelEnvelope(document: AxonDocument): ModelEnvelope {
  const walls = document.walls;
  if (walls.length === 0) return { ...EMPTY, center: { ...EMPTY.center }, size: { ...EMPTY.size } };

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const w of walls) {
    minX = Math.min(minX, w.p1.x, w.p2.x);
    maxX = Math.max(maxX, w.p1.x, w.p2.x);
    minY = Math.min(minY, w.p1.y, w.p2.y);
    maxY = Math.max(maxY, w.p1.y, w.p2.y);
    const z0 = Math.min(w.p1.z, w.p2.z);
    const z1 = Math.max(w.p1.z, w.p2.z) + w.height;
    minZ = Math.min(minZ, z0);
    maxZ = Math.max(maxZ, z1);
  }

  const size = { x: maxX - minX, y: maxY - minY, z: maxZ - minZ };
  return {
    minX,
    minY,
    minZ,
    maxX,
    maxY,
    maxZ,
    center: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2,
    },
    size,
    empty: false,
  };
}
