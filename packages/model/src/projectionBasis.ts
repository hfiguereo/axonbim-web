/**
 * LR3-D — formal projection bases for technical / ortho views.
 * World: +X East, +Y North, +Z Up (docs/architecture/coordinate-system.md).
 * Linked to viewer `CameraPreset` names for the existing gizmo (ADR 0014).
 */

export type ProjectionBasisId = "top" | "north" | "south" | "east" | "west";

export type Vec3 = { x: number; y: number; z: number };

export type ProjectionBasis = {
  id: ProjectionBasisId;
  /** Unit vector from target toward eye. */
  eyeOffset: Vec3;
  /** Camera up. */
  up: Vec3;
  /** Drawing horizontal axis (+right on sheet) in world. */
  axisU: Vec3;
  /** Drawing vertical axis (+up on sheet) in world. */
  axisV: Vec3;
  /**
   * Matching gizmo / viewport preset id.
   * Naming note: viewer `front` = eye from south looking north (south elevation of massing).
   */
  cameraPreset: "top" | "front" | "back" | "left" | "right";
};

const BASES: Record<ProjectionBasisId, ProjectionBasis> = {
  top: {
    id: "top",
    eyeOffset: { x: 0, y: 0, z: 1 },
    up: { x: 0, y: 1, z: 0 },
    axisU: { x: 1, y: 0, z: 0 },
    axisV: { x: 0, y: 1, z: 0 },
    cameraPreset: "top",
  },
  /** Looking south (−Y): north facade of the model. */
  north: {
    id: "north",
    eyeOffset: { x: 0, y: 1, z: 0 },
    up: { x: 0, y: 0, z: 1 },
    axisU: { x: 1, y: 0, z: 0 },
    axisV: { x: 0, y: 0, z: 1 },
    cameraPreset: "back",
  },
  /** Looking north (+Y): south facade. */
  south: {
    id: "south",
    eyeOffset: { x: 0, y: -1, z: 0 },
    up: { x: 0, y: 0, z: 1 },
    axisU: { x: 1, y: 0, z: 0 },
    axisV: { x: 0, y: 0, z: 1 },
    cameraPreset: "front",
  },
  /** Looking west (−X): east facade. */
  east: {
    id: "east",
    eyeOffset: { x: 1, y: 0, z: 0 },
    up: { x: 0, y: 0, z: 1 },
    axisU: { x: 0, y: 1, z: 0 },
    axisV: { x: 0, y: 0, z: 1 },
    cameraPreset: "right",
  },
  /** Looking east (+X): west facade. */
  west: {
    id: "west",
    eyeOffset: { x: -1, y: 0, z: 0 },
    up: { x: 0, y: 0, z: 1 },
    axisU: { x: 0, y: -1, z: 0 },
    axisV: { x: 0, y: 0, z: 1 },
    cameraPreset: "left",
  },
};

export function getProjectionBasis(id: ProjectionBasisId): ProjectionBasis {
  return BASES[id];
}

export function allProjectionBases(): ProjectionBasis[] {
  return (Object.keys(BASES) as ProjectionBasisId[]).map((id) => BASES[id]);
}

/** World → drawing (u, v) for a point on/near the view plane. */
export function projectWorldToDrawing(
  basis: ProjectionBasis,
  world: Vec3,
  origin: Vec3 = { x: 0, y: 0, z: 0 },
): { u: number; v: number } {
  const dx = world.x - origin.x;
  const dy = world.y - origin.y;
  const dz = world.z - origin.z;
  return {
    u: dx * basis.axisU.x + dy * basis.axisU.y + dz * basis.axisU.z,
    v: dx * basis.axisV.x + dy * basis.axisV.y + dz * basis.axisV.z,
  };
}
