/**
 * Convert a provisional world-space face outline to WallVerticalDefinition (ADR 0018).
 * Pure helper for SK-wall-profile-v1 Bloque 6A commit.
 */
import {
  almostEqual,
  EPS_LENGTH,
  SNAP_TOLERANCE,
  type Vec3,
} from "@axonbim/shared";
import {
  validateWallProfile,
  wallLength,
  wallMaxHeight,
  worldToWallProfileUV,
  type Wall,
  type WallProfilePoint,
  type WallVerticalDefinition,
} from "@axonbim/model";

function dedupeLoop(loop: WallProfilePoint[], eps = SNAP_TOLERANCE): WallProfilePoint[] {
  if (loop.length === 0) return [];
  const out: WallProfilePoint[] = [];
  for (const p of loop) {
    const prev = out[out.length - 1];
    if (prev && almostEqual(prev.u, p.u, eps) && almostEqual(prev.v, p.v, eps)) {
      continue;
    }
    out.push({ u: p.u, v: p.v });
  }
  if (out.length >= 2) {
    const a = out[0]!;
    const b = out[out.length - 1]!;
    if (almostEqual(a.u, b.u, eps) && almostEqual(a.v, b.v, eps)) {
      out.pop();
    }
  }
  return out;
}

/** True if loop is the axis-aligned rectangle [0,L]×[0,H] (uniform wall). */
function isUniformRectangle(
  loop: readonly WallProfilePoint[],
  wallLen: number,
  eps = EPS_LENGTH,
): { height: number } | null {
  if (loop.length !== 4) return null;
  const us = loop.map((p) => p.u);
  const vs = loop.map((p) => p.v);
  const uMin = Math.min(...us);
  const uMax = Math.max(...us);
  const vMin = Math.min(...vs);
  const vMax = Math.max(...vs);
  if (!almostEqual(uMin, 0, eps) || !almostEqual(uMax, wallLen, eps)) return null;
  if (!almostEqual(vMin, 0, eps)) return null;
  // All verts must lie on the AABB corners (no mid-edge extras with wrong v).
  for (const p of loop) {
    const onU =
      almostEqual(p.u, 0, eps) || almostEqual(p.u, wallLen, eps);
    const onV =
      almostEqual(p.v, 0, eps) || almostEqual(p.v, vMax, eps);
    if (!(onU && onV)) return null;
  }
  if (vMax <= eps) return null;
  return { height: vMax };
}

/**
 * Map world ring on a wall face to a vertical definition.
 * Returns null if UV mapping or profile validation fails.
 */
export function worldRingToWallVertical(
  wall: Pick<Wall, "p1" | "p2" | "vertical">,
  ring: readonly Vec3[],
): WallVerticalDefinition | null {
  const len = wallLength(wall);
  const raw: WallProfilePoint[] = [];
  for (const p of ring) {
    const uv = worldToWallProfileUV(wall, p);
    if (!uv) return null;
    raw.push(uv);
  }
  const loop = dedupeLoop(raw);
  const issue = validateWallProfile(loop, len);
  if (issue) return null;

  const rect = isUniformRectangle(loop, len);
  if (rect) {
    return { kind: "uniform", height: rect.height };
  }
  return {
    kind: "profile",
    outerLoop: loop.map((p) => ({ u: p.u, v: p.v })),
  };
}

/** Max height helper for tests / status. */
export function verticalFromRingHeight(
  vertical: WallVerticalDefinition,
): number {
  return wallMaxHeight(vertical);
}
