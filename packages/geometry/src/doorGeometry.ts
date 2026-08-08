import type { Door, Wall } from "@axonbim/model";
import { DOOR_LEAF_ANGLE_RAD } from "@axonbim/model";
import { MIN_WALL_LENGTH } from "@axonbim/shared";
import type { PlanFlipControl } from "./planControls";
import type { MeshBuffer } from "./types";
import { emptyMesh } from "./wallBox";

export type { PlanFlipControl } from "./planControls";

type Acc = { positions: number[]; normals: number[]; indices: number[] };
type V = { x: number; y: number; z: number };

export type DoorBasis = {
  ux: number;
  uy: number;
  nx: number;
  ny: number;
  hx: number;
  hy: number;
  /** Unit leaf direction at current leafState. */
  lx: number;
  ly: number;
  leafLen: number;
  leafT: number;
  z0: number;
  z1: number;
  baseZ: number;
  swingSign: number;
  closedAlong: number;
  hingeSign: number;
};

export type DoorMeshes = {
  frame: MeshBuffer;
  leaf: MeshBuffer;
  hardware: MeshBuffer;
};

export type DoorPlanSymbol = {
  /** LineSegments positions (xyz pairs). */
  lines: Float32Array;
  flipControls: PlanFlipControl[];
};

function finish(acc: Acc): MeshBuffer {
  if (acc.positions.length === 0) return emptyMesh();
  return {
    positions: new Float32Array(acc.positions),
    normals: new Float32Array(acc.normals),
    indices: new Uint32Array(acc.indices),
  };
}

function appendFace(acc: Acc, a: V, b: V, c: V, d: V, n: V): void {
  const base = acc.positions.length / 3;
  for (const v of [a, b, c, d]) {
    acc.positions.push(v.x, v.y, v.z);
    acc.normals.push(n.x, n.y, n.z);
  }
  acc.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

/** Box from origin along unit (ux,uy) and (vx,vy), ranges [u0,u1]×[v0,v1]×[z0,z1]. */
function appendBox(
  acc: Acc,
  ox: number,
  oy: number,
  ux: number,
  uy: number,
  vx: number,
  vy: number,
  u0: number,
  u1: number,
  v0: number,
  v1: number,
  z0: number,
  z1: number,
): void {
  if (u1 - u0 < 1e-6 || v1 - v0 < 1e-6 || z1 - z0 < 1e-6) return;
  const c = (u: number, v: number, z: number): V => ({
    x: ox + ux * u + vx * v,
    y: oy + uy * u + vy * v,
    z,
  });
  const b00 = c(u0, v0, z0);
  const b10 = c(u1, v0, z0);
  const b11 = c(u1, v1, z0);
  const b01 = c(u0, v1, z0);
  const t00 = c(u0, v0, z1);
  const t10 = c(u1, v0, z1);
  const t11 = c(u1, v1, z1);
  const t01 = c(u0, v1, z1);
  appendFace(acc, b00, b10, b11, b01, { x: 0, y: 0, z: -1 });
  appendFace(acc, t00, t01, t11, t10, { x: 0, y: 0, z: 1 });
  appendFace(acc, b00, b01, t01, t00, { x: -ux, y: -uy, z: 0 });
  appendFace(acc, b10, t10, t11, b11, { x: ux, y: uy, z: 0 });
  appendFace(acc, b00, t00, t10, b10, { x: -vx, y: -vy, z: 0 });
  appendFace(acc, b01, b11, t11, t01, { x: vx, y: vy, z: 0 });
}

/** Frame lining thickness (sides + head). No bottom frame / threshold. */
export const DOOR_JAMB_W = 0.05;
export const DOOR_HEAD_H = 0.06;
export const DOOR_LEAF_GAP = 0.006;

export function doorBasis(wall: Wall, door: Door): DoorBasis | null {
  const dx = wall.p2.x - wall.p1.x;
  const dy = wall.p2.y - wall.p1.y;
  const length = Math.hypot(dx, dy);
  if (length < MIN_WALL_LENGTH) return null;
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const baseZ = Math.min(wall.p1.z, wall.p2.z);
  const openLeft = door.centerOffset - door.width / 2;
  const openRight = door.centerOffset + door.width / 2;
  // Clear opening inside jambs (frame lines the rough opening)
  const clearLeft = openLeft + DOOR_JAMB_W;
  const clearRight = openRight - DOOR_JAMB_W;
  const clearW = Math.max(0.2, clearRight - clearLeft - DOOR_LEAF_GAP);
  const leafT = Math.min(0.04, wall.thickness * 0.35);
  const hingeSign = door.hinge === "start" ? -1 : 1;
  const closedAlong = -hingeSign;
  const swingSign = (door.swing ?? "positive") === "negative" ? -1 : 1;
  // Hinge on inner face of jamb
  const hingeAlong =
    door.hinge === "start" ? clearLeft + DOOR_LEAF_GAP * 0.5 : clearRight - DOOR_LEAF_GAP * 0.5;
  const open = DOOR_LEAF_ANGLE_RAD[door.leafState ?? "open"];
  const cos = Math.cos(open);
  const sin = Math.sin(open);
  const lx = ux * closedAlong * cos + nx * swingSign * sin;
  const ly = uy * closedAlong * cos + ny * swingSign * sin;
  const hx = wall.p1.x + ux * hingeAlong;
  const hy = wall.p1.y + uy * hingeAlong;
  // Leaf sits on floor/sill — no bottom frame; under head jamb
  const z0 = baseZ + door.sill;
  const z1 = baseZ + door.sill + door.height - DOOR_HEAD_H - DOOR_LEAF_GAP;
  return {
    ux,
    uy,
    nx,
    ny,
    hx,
    hy,
    lx,
    ly,
    leafLen: clearW,
    leafT,
    z0,
    z1,
    baseZ,
    swingSign,
    closedAlong,
    hingeSign,
  };
}

/** Legacy thin leaf (kept for tests / callers). Prefer doorAssemblyMeshes. */
export function doorLeafMesh(wall: Wall, door: Door): MeshBuffer {
  const parts = doorAssemblyMeshes(wall, door);
  const acc: Acc = { positions: [], normals: [], indices: [] };
  for (const part of [parts.frame, parts.leaf, parts.hardware]) {
    const base = acc.positions.length / 3;
    for (let i = 0; i < part.positions.length; i++) {
      acc.positions.push(part.positions[i]!);
      acc.normals.push(part.normals[i]!);
    }
    for (let i = 0; i < part.indices.length; i++) {
      acc.indices.push(part.indices[i]! + base);
    }
  }
  return finish(acc);
}

/**
 * Door assembly: frame lining inside the wall opening (jambs + head only — no sill),
 * panelled leaf, hinges, horizontal lever (90° from vertical).
 */
export function doorAssemblyMeshes(wall: Wall, door: Door): DoorMeshes {
  const b = doorBasis(wall, door);
  if (!b) {
    return { frame: emptyMesh(), leaf: emptyMesh(), hardware: emptyMesh() };
  }
  const { ux, uy, nx, ny, hx, hy, lx, ly, leafLen, leafT, z0, z1, baseZ } = b;
  const frameAcc: Acc = { positions: [], normals: [], indices: [] };
  const leafAcc: Acc = { positions: [], normals: [], indices: [] };
  const hardAcc: Acc = { positions: [], normals: [], indices: [] };

  const openLeft = door.centerOffset - door.width / 2;
  const openRight = door.centerOffset + door.width / 2;
  const clearLeft = openLeft + DOOR_JAMB_W;
  const clearRight = openRight - DOOR_JAMB_W;
  const frameDepth = Math.max(0.08, Math.min(wall.thickness * 0.95, wall.thickness - 0.005));
  const halfT = frameDepth / 2;
  const ox = wall.p1.x;
  const oy = wall.p1.y;
  const zSill = baseZ + door.sill;
  const zHead = zSill + door.height;
  const zUnderHead = zHead - DOOR_HEAD_H;

  // Jambs + head line the INSIDE of the wall rough opening (visible in the void).
  // No bottom frame / threshold.
  appendBox(
    frameAcc,
    ox,
    oy,
    ux,
    uy,
    nx,
    ny,
    openLeft,
    clearLeft,
    -halfT,
    halfT,
    zSill,
    zHead,
  );
  appendBox(
    frameAcc,
    ox,
    oy,
    ux,
    uy,
    nx,
    ny,
    clearRight,
    openRight,
    -halfT,
    halfT,
    zSill,
    zHead,
  );
  appendBox(
    frameAcc,
    ox,
    oy,
    ux,
    uy,
    nx,
    ny,
    openLeft,
    openRight,
    -halfT,
    halfT,
    zUnderHead,
    zHead,
  );

  // Leaf between jambs, under head
  const ht = leafT / 2;
  const stile = Math.min(0.08, leafLen * 0.12);
  const rail = 0.1;
  const midRail = 0.08;
  const panelInset = 0.01;
  const midZ = z0 + (z1 - z0) * 0.52;

  appendBox(leafAcc, hx, hy, lx, ly, -ly, lx, 0, leafLen, -ht, ht, z0, z1);

  // Raised panels on outer face
  const faceV = ht;
  appendBox(
    leafAcc,
    hx,
    hy,
    lx,
    ly,
    -ly,
    lx,
    stile,
    leafLen - stile,
    faceV,
    faceV + panelInset,
    z0 + rail,
    midZ - midRail / 2,
  );
  appendBox(
    leafAcc,
    hx,
    hy,
    lx,
    ly,
    -ly,
    lx,
    stile,
    leafLen - stile,
    faceV,
    faceV + panelInset,
    midZ + midRail / 2,
    z1 - rail,
  );

  // Hinges on hinge stile
  const hingeDepth = leafT * 0.85;
  for (const t of [0.18, 0.5, 0.82]) {
    const hz = z0 + (z1 - z0) * t;
    appendBox(
      hardAcc,
      hx,
      hy,
      lx,
      ly,
      -ly,
      lx,
      -0.008,
      0.01,
      -hingeDepth / 2,
      hingeDepth / 2,
      hz - 0.035,
      hz + 0.035,
    );
  }

  // Lockset: rose + lever horizontal (90° from vertical), pointing toward hinge
  const handleU = leafLen - 0.07;
  const handleZ = z0 + (z1 - z0) * 0.48;
  const rose = 0.028;
  const leverLen = 0.11;
  const leverThick = 0.018;
  const leverOut = 0.045;
  // Rose / escutcheon on face
  appendBox(
    hardAcc,
    hx,
    hy,
    lx,
    ly,
    -ly,
    lx,
    handleU - rose,
    handleU + rose,
    ht,
    ht + 0.015,
    handleZ - rose,
    handleZ + rose,
  );
  // Lever arm: horizontal along leaf (toward hinge = −U), not upward
  appendBox(
    hardAcc,
    hx,
    hy,
    lx,
    ly,
    -ly,
    lx,
    handleU - leverLen,
    handleU + 0.01,
    ht + 0.012,
    ht + leverOut,
    handleZ - leverThick / 2,
    handleZ + leverThick / 2,
  );

  return {
    frame: finish(frameAcc),
    leaf: finish(leafAcc),
    hardware: finish(hardAcc),
  };
}

/** Plan symbol: leaf + swing arc + flip grips (architectural convention). */
export function doorPlanSymbol(wall: Wall, door: Door): DoorPlanSymbol | null {
  const b = doorBasis(wall, door);
  if (!b) return null;
  const { ux, uy, nx, ny, hx, hy, swingSign, closedAlong, leafLen } = b;
  const z = b.baseZ + Math.max(wall.height, door.height) + 0.15;
  const R = Math.max(0.15, b.leafLen);
  const steps = 16;
  const lines: number[] = [];

  // Leaf at current angle
  const tipX = hx + b.lx * leafLen;
  const tipY = hy + b.ly * leafLen;
  lines.push(hx, hy, z, tipX, tipY, z);

  // Swing arc from closed (0) to open (90°)
  let prevX = hx + ux * closedAlong * R;
  let prevY = hy + uy * closedAlong * R;
  for (let i = 1; i <= steps; i++) {
    const ang = (Math.PI / 2) * (i / steps);
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const dx = ux * closedAlong * c + nx * swingSign * s;
    const dy = uy * closedAlong * c + ny * swingSign * s;
    const x = hx + dx * R;
    const y = hy + dy * R;
    lines.push(prevX, prevY, z, x, y, z);
    prevX = x;
    prevY = y;
  }

  // Flip grips: mid-arc (swing) and near hinge offset (hinge)
  const midAng = Math.PI / 4;
  const mc = Math.cos(midAng);
  const ms = Math.sin(midAng);
  const midDx = ux * closedAlong * mc + nx * swingSign * ms;
  const midDy = uy * closedAlong * mc + ny * swingSign * ms;
  const swingX = hx + midDx * R * 0.72;
  const swingY = hy + midDy * R * 0.72;

  const hingeGripX = hx - ux * closedAlong * 0.18 + nx * swingSign * 0.12;
  const hingeGripY = hy - uy * closedAlong * 0.18 + ny * swingSign * 0.12;

  const flipControls: PlanFlipControl[] = [
    {
      entityType: "door",
      entityId: door.id,
      kind: "swing",
      x: swingX,
      y: swingY,
      z,
      hitRadius: 0.14,
    },
    {
      entityType: "door",
      entityId: door.id,
      kind: "hinge",
      x: hingeGripX,
      y: hingeGripY,
      z,
      hitRadius: 0.12,
    },
  ];

  return { lines: new Float32Array(lines), flipControls };
}
