import type { AxonDocument, Storey } from "./types.js";
import { getActiveStorey } from "./activeStorey.js";

/**
 * Workplanes v1 — shared spatial reference for tools.
 * Derived from the active storey (horizontal plane). Not persisted in AxonDocument.
 * Sketch / Edit Mode / custom planes are out of this cut.
 */

export type Vec3 = { x: number; y: number; z: number };

export type WorkplaneKind = "storey";

export type Workplane = {
  id: string;
  kind: WorkplaneKind;
  label: string;
  origin: Vec3;
  /** Unit normal (world). */
  normal: Vec3;
  /** Unit +U in plane (world). Storey planes: +X. */
  axisU: Vec3;
  /** Unit +V in plane (world). Storey planes: +Y. */
  axisV: Vec3;
  storeyId: string;
};

/** Shared spatial stack: Storey → Workplane (modes share this; not edit rules). */
export type SpatialReferenceContext = {
  storeyId: string;
  workplane: Workplane;
};

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

/** World (x,y) → point on workplane (storey: z = elevation). */
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
