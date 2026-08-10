import { MIN_WALL_LENGTH } from "@axonbim/shared";
import type { AxonDocument, Storey, Wall } from "./types.js";
import { getActiveStorey } from "./activeStorey.js";

/**
 * Workplanes WP-v1/v2 — shared spatial reference for tools.
 * Derived / session overrides. Never persisted in AxonDocument.
 */

export type Vec3 = { x: number; y: number; z: number };

export type WorkplaneKind = "storey" | "surface" | "line";

export type WorkplaneHost = {
  kind: "wall";
  id: string;
  face: "front" | "back";
};

export type Workplane = {
  id: string;
  kind: WorkplaneKind;
  label: string;
  origin: Vec3;
  /** Unit normal (world). */
  normal: Vec3;
  /** Unit +U in plane (world). */
  axisU: Vec3;
  /** Unit +V in plane (world). */
  axisV: Vec3;
  /** Level context (always set). */
  storeyId: string;
  /** Present when kind === "surface". */
  host?: WorkplaneHost;
};

/** Shared spatial stack: Storey → Workplane (modes share this; not edit rules). */
export type SpatialReferenceContext = {
  storeyId: string;
  workplane: Workplane;
};

function normalize(v: Vec3): Vec3 | null {
  const len = Math.hypot(v.x, v.y, v.z);
  if (len < 1e-9) return null;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/** Horizontal workplane at storey elevation (world XY, +Z up). */
export function workplaneFromStorey(storey: Storey): Workplane {
  return {
    id: `workplane.storey.${storey.id}`,
    kind: "storey",
    label: storey.name,
    origin: { x: 0, y: 0, z: storey.elevation },
    normal: { x: 0, y: 0, z: 1 },
    axisU: { x: 1, y: 0, z: 0 },
    axisV: { x: 0, y: 1, z: 0 },
    storeyId: storey.id,
  };
}

/**
 * Vertical workplane on a wall face.
 * front = left of p1→p2 in plan (+90° CCW from axis); back = opposite.
 */
export function workplaneFromWallFace(
  wall: Wall,
  face: "front" | "back",
): Workplane | null {
  const dx = wall.p2.x - wall.p1.x;
  const dy = wall.p2.y - wall.p1.y;
  const axisU = normalize({ x: dx, y: dy, z: 0 });
  if (!axisU) return null;
  // Left normal of axis in XY
  let nx = -axisU.y;
  let ny = axisU.x;
  if (face === "back") {
    nx = -nx;
    ny = -ny;
  }
  const normal = { x: nx, y: ny, z: 0 };
  const half = wall.thickness * 0.5;
  const mid = {
    x: (wall.p1.x + wall.p2.x) / 2,
    y: (wall.p1.y + wall.p2.y) / 2,
    z: wall.p1.z,
  };
  const origin = {
    x: mid.x + normal.x * half,
    y: mid.y + normal.y * half,
    z: mid.z,
  };
  return {
    id: `workplane.surface.${wall.id}.${face}`,
    kind: "surface",
    label: `Cara ${face === "front" ? "frente" : "dorso"} · muro`,
    origin,
    normal,
    axisU,
    axisV: { x: 0, y: 0, z: 1 },
    storeyId: wall.storeyId,
    host: { kind: "wall", id: wall.id, face },
  };
}

/**
 * Vertical workplane from a plan trace (2 points).
 * axisU = direction of line in XY, axisV = +Z, normal = U × V.
 */
export function workplaneFromLineTrace(
  p1: Vec3,
  p2: Vec3,
  storeyId: string,
  elevation: number,
): Workplane | null {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len < MIN_WALL_LENGTH) return null;
  const axisU = { x: dx / len, y: dy / len, z: 0 };
  const axisV = { x: 0, y: 0, z: 1 };
  const normal = normalize(cross(axisU, axisV));
  if (!normal) return null;
  const origin = {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
    z: elevation,
  };
  return {
    id: `workplane.line.${storeyId}.${origin.x.toFixed(3)}.${origin.y.toFixed(3)}`,
    kind: "line",
    label: "Plano por línea",
    origin,
    normal,
    axisU,
    axisV,
    storeyId,
  };
}

/** Level workplane for the active storey (ignores surface/line overrides). */
export function resolveSpatialReference(
  document: AxonDocument,
  activeStoreyId: string | null | undefined,
): SpatialReferenceContext {
  const storey = getActiveStorey(document, activeStoreyId);
  return {
    storeyId: storey.id,
    workplane: workplaneFromStorey(storey),
  };
}

export function getActiveWorkplane(
  document: AxonDocument,
  activeStoreyId: string | null | undefined,
): Workplane {
  return resolveSpatialReference(document, activeStoreyId).workplane;
}

/** Orthogonal projection of a world point onto the workplane. */
export function projectPointOntoWorkplane(wp: Workplane, p: Vec3): Vec3 {
  const dx = p.x - wp.origin.x;
  const dy = p.y - wp.origin.y;
  const dz = p.z - wp.origin.z;
  const dist = dx * wp.normal.x + dy * wp.normal.y + dz * wp.normal.z;
  return {
    x: p.x - dist * wp.normal.x,
    y: p.y - dist * wp.normal.y,
    z: p.z - dist * wp.normal.z,
  };
}

/** World (x,y) → point on workplane (storey: z = elevation; general: project). */
export function pointOnWorkplaneXY(wp: Workplane, x: number, y: number): Vec3 {
  return projectPointOntoWorkplane(wp, { x, y, z: wp.origin.z });
}

export function workplanePointFromUV(wp: Workplane, u: number, v: number): Vec3 {
  return {
    x: wp.origin.x + u * wp.axisU.x + v * wp.axisV.x,
    y: wp.origin.y + u * wp.axisU.y + v * wp.axisV.y,
    z: wp.origin.z + u * wp.axisU.z + v * wp.axisV.z,
  };
}

/** Local UV of a world point projected onto the workplane. */
export function worldToWorkplaneUV(wp: Workplane, p: Vec3): { u: number; v: number } {
  const on = projectPointOntoWorkplane(wp, p);
  const dx = on.x - wp.origin.x;
  const dy = on.y - wp.origin.y;
  const dz = on.z - wp.origin.z;
  return {
    u: dx * wp.axisU.x + dy * wp.axisU.y + dz * wp.axisU.z,
    v: dx * wp.axisV.x + dy * wp.axisV.y + dz * wp.axisV.z,
  };
}

/**
 * Ray ∩ plane. Returns null if parallel / behind (t < 0 when requireForward).
 * Ray: origin + t * direction (direction need not be unit).
 */
export function intersectRayWorkplane(
  wp: Workplane,
  rayOrigin: Vec3,
  rayDir: Vec3,
  opts?: { requireForward?: boolean },
): Vec3 | null {
  const denom =
    rayDir.x * wp.normal.x + rayDir.y * wp.normal.y + rayDir.z * wp.normal.z;
  if (Math.abs(denom) < 1e-9) return null;
  const ox = wp.origin.x - rayOrigin.x;
  const oy = wp.origin.y - rayOrigin.y;
  const oz = wp.origin.z - rayOrigin.z;
  const t =
    (ox * wp.normal.x + oy * wp.normal.y + oz * wp.normal.z) / denom;
  if (opts?.requireForward !== false && t < 0) return null;
  return {
    x: rayOrigin.x + t * rayDir.x,
    y: rayOrigin.y + t * rayDir.y,
    z: rayOrigin.z + t * rayDir.z,
  };
}

/** Finite patch corners in world (for viewer overlay), half-extents in U/V. */
export function workplanePatchCorners(
  wp: Workplane,
  halfU = 4,
  halfV = 2.5,
): [Vec3, Vec3, Vec3, Vec3] {
  const a = workplanePointFromUV(wp, -halfU, -halfV);
  const b = workplanePointFromUV(wp, halfU, -halfV);
  const c = workplanePointFromUV(wp, halfU, halfV);
  const d = workplanePointFromUV(wp, -halfU, halfV);
  return [a, b, c, d];
}

export function workplaneStatusLabel(wp: Workplane): string {
  if (wp.kind === "storey") {
    return `Nivel «${wp.label}» (z=${wp.origin.z.toFixed(2)} m)`;
  }
  if (wp.kind === "surface") {
    return wp.label;
  }
  return wp.label;
}

/** Unit outward normal of the wall front face in XY (left of p1→p2). */
export function wallFrontNormalXY(wall: Wall): { x: number; y: number } {
  const dx = wall.p2.x - wall.p1.x;
  const dy = wall.p2.y - wall.p1.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: -dy / len, y: dx / len };
}

/** Which wall face is toward a world point (plan-side test). */
export function wallFaceTowardPoint(
  wall: Wall,
  point: Vec3,
): "front" | "back" {
  const n = wallFrontNormalXY(wall);
  const mx = (wall.p1.x + wall.p2.x) / 2;
  const my = (wall.p1.y + wall.p2.y) / 2;
  const dot = (point.x - mx) * n.x + (point.y - my) * n.y;
  return dot >= 0 ? "front" : "back";
}

/**
 * Map a world-space hit normal to front/back (ADR 0018 / WallHit).
 * Uses XY components of the mesh normal vs the wall front normal.
 */
export function wallFaceFromWorldNormal(
  wall: Wall,
  worldNormal: Vec3,
): "front" | "back" {
  const n = wallFrontNormalXY(wall);
  const dot = worldNormal.x * n.x + worldNormal.y * n.y;
  return dot >= 0 ? "front" : "back";
}
